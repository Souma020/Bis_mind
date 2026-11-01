const fs = require('fs');
const path = require('path');
const { connectDB } = require('./init');
const {
    Source,
    Standard,
    Service,
    Document,
    DocumentChunk
} = require('./models');

const embeddingService = require('../backend/services/embeddingService');

// Store an embedding with every chunk so retrieval doesn't have to re-embed on each question.
async function withEmbedding(chunk) {
    try {
        const embedding = await embeddingService.getEmbedding(chunk.content);
        return { ...chunk, embedding };
    } catch (e) {
        return chunk;
    }
}

async function seedDatabase() {
    await connectDB();
    console.log('Seeding Know Your BIS MongoDB database...');

    // Load JSON data
    const standardsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/bis_standards.json'), 'utf8'));
    const qcoData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/qco_orders.json'), 'utf8'));
    const servicesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/bis_services.json'), 'utf8'));

    // 1. Seed Sources
    const sources = [
        {
            id: 'src-bis-gov',
            name: 'Bureau of Indian Standards Official Portal',
            url: 'https://www.bis.gov.in/',
            type: 'official_portal',
            publisher: 'Bureau of Indian Standards',
            trust_tier: 1
        },
        {
            id: 'src-standards-bis',
            name: 'BIS Standards Portal (BSBEDGE)',
            url: 'https://standardsbis.bsbedge.com/',
            type: 'standards_catalog',
            publisher: 'Bureau of Indian Standards',
            trust_tier: 1
        },
        {
            id: 'src-crs-bis',
            name: 'BIS Compulsory Registration Scheme Portal',
            url: 'https://www.crsbis.in/BIS/',
            type: 'official_portal',
            publisher: 'MeitY & BIS',
            trust_tier: 1
        }
    ];

    for (const src of sources) {
        await Source.findOneAndUpdate({ id: src.id }, src, { upsert: true, returnDocument: 'after' });
    }

    // 2. Seed Standards, Standard Documents & Chunks
    for (const std of standardsData) {
        const standardDoc = {
            id: std.id,
            is_number: std.isNumber,
            year: std.year,
            title: std.title,
            category: std.category,
            department: std.department || 'General Department',
            is_mandatory: Boolean(std.isMandatory),
            qco_order: std.qcoOrder || null,
            qco_notification_date: std.qcoNotificationDate || null,
            enforcing_ministry: std.enforcingMinistry || null,
            scope: std.scope,
            testing_requirements: std.testingRequirements || [],
            clauses: std.clauses || [],
            scheme: std.scheme,
            official_url: std.officialUrl,
            lab_capabilities: std.labCapabilities || []
        };

        await Standard.findOneAndUpdate({ id: std.id }, standardDoc, { upsert: true, returnDocument: 'after' });

        // Document entry for RAG
        const docId = `doc-${std.id}`;
        const documentRecord = {
            id: docId,
            source_id: 'src-standards-bis',
            title: `${std.isNumber}:${std.year} ${std.title}`,
            document_type: 'standard_spec',
            is_number: std.isNumber,
            year: std.year,
            category: std.category,
            content: `${std.isNumber}:${std.year} - ${std.title}.\nScope: ${std.scope}\nMandatory QCO: ${std.isMandatory ? std.qcoOrder : 'Voluntary'}.\nScheme: ${std.scheme}`,
            metadata: { mandatory: std.isMandatory, scheme: std.scheme }
        };
        await Document.findOneAndUpdate({ id: docId }, documentRecord, { upsert: true, returnDocument: 'after' });

        // Chunks for RAG
        let chunkIdx = 0;
        const overviewChunk = {
            id: `chunk-${std.id}-overview`,
            document_id: docId,
            chunk_index: chunkIdx++,
            content: `Standard ${std.isNumber}:${std.year}: ${std.title}. Category: ${std.category}. Scope: ${std.scope}. Mandatory Status: ${std.isMandatory ? 'MANDATORY under QCO (' + std.qcoOrder + ')' : 'Voluntary Benchmark'}. Certified Scheme: ${std.scheme}. Testing Requirements: ${(std.testingRequirements || []).join(', ')}.`,
            is_number: std.isNumber,
            keywords: `${std.isNumber}, ${std.title}, ${std.category}, ${std.scheme}, mandatory, ISI mark`,
            doc_title: documentRecord.title,
            document_type: 'standard_spec',
            source_name: 'BIS Standards Portal (BSBEDGE)',
            source_url: std.officialUrl
        };
        await DocumentChunk.findOneAndUpdate({ id: overviewChunk.id }, await withEmbedding(overviewChunk), { upsert: true, returnDocument: 'after' });

        for (const clause of (std.clauses || [])) {
            const clauseChunk = {
                id: `chunk-${std.id}-clause-${clause.clauseNo.replace(/\./g, '_')}`,
                document_id: docId,
                chunk_index: chunkIdx++,
                content: `Official Clause ${clause.clauseNo} (${clause.title}) of ${std.isNumber}: ${clause.text}`,
                is_number: std.isNumber,
                clause_no: clause.clauseNo,
                clause_title: clause.title,
                keywords: `${std.isNumber}, clause ${clause.clauseNo}, ${clause.title}`,
                doc_title: documentRecord.title,
                document_type: 'standard_spec',
                source_name: 'BIS Standards Portal (BSBEDGE)',
                source_url: std.officialUrl
            };
            await DocumentChunk.findOneAndUpdate({ id: clauseChunk.id }, await withEmbedding(clauseChunk), { upsert: true, returnDocument: 'after' });
        }
    }

    // 3. Seed QCO Documents & Chunks
    for (const qco of qcoData) {
        const docId = `doc-${qco.id}`;
        const documentRecord = {
            id: docId,
            source_id: 'src-bis-gov',
            title: qco.orderName,
            document_type: 'qco_order',
            content: `Official Notification ${qco.notificationNumber} dated ${qco.notificationDate} issued by ${qco.issuingMinistry}. ${qco.summary} Affected Products: ${qco.affectedProducts.join(', ')}.`,
            metadata: qco
        };
        await Document.findOneAndUpdate({ id: docId }, documentRecord, { upsert: true, returnDocument: 'after' });

        const qcoChunk = {
            id: `chunk-${qco.id}`,
            document_id: docId,
            chunk_index: 0,
            content: `Quality Control Order: ${qco.orderName} (${qco.notificationNumber}, ${qco.notificationDate}) issued by ${qco.issuingMinistry}. Summary: ${qco.summary} Mandatory Coverage: ${qco.affectedProducts.join('; ')}.`,
            keywords: `${qco.orderName}, QCO, ${qco.issuingMinistry}, mandatory certification`,
            doc_title: qco.orderName,
            document_type: 'qco_order',
            source_name: 'Bureau of Indian Standards Official Portal',
            source_url: 'https://www.bis.gov.in/'
        };
        await DocumentChunk.findOneAndUpdate({ id: qcoChunk.id }, await withEmbedding(qcoChunk), { upsert: true, returnDocument: 'after' });
    }

    // 4. Seed Services
    for (const srv of servicesData) {
        const serviceDoc = {
            id: srv.id,
            name: srv.name,
            category: srv.category,
            description: srv.description,
            target_audience: srv.targetAudience,
            key_steps: srv.keySteps || [],
            portal_url: srv.portalUrl,
            is_mandatory_available: Boolean(srv.isMandatoryAvailable)
        };
        await Service.findOneAndUpdate({ id: srv.id }, serviceDoc, { upsert: true, returnDocument: 'after' });

        const docId = `doc-service-${srv.id}`;
        const documentRecord = {
            id: docId,
            source_id: 'src-bis-gov',
            title: `BIS Service: ${srv.name}`,
            document_type: 'scheme_doc',
            content: `${srv.name} (${srv.category}): ${srv.description}\nTarget Audience: ${srv.targetAudience}\nPortal: ${srv.portalUrl}`
        };
        await Document.findOneAndUpdate({ id: docId }, documentRecord, { upsert: true, returnDocument: 'after' });

        const serviceChunk = {
            id: `chunk-service-${srv.id}`,
            document_id: docId,
            chunk_index: 0,
            content: `BIS Service ${srv.name}: ${srv.description} Key Steps: ${(srv.keySteps || []).join(' -> ')}. Target: ${srv.targetAudience}. Portal: ${srv.portalUrl}`,
            keywords: `${srv.name}, ${srv.category}, BIS scheme, ${srv.portalUrl}`,
            doc_title: `BIS Service: ${srv.name}`,
            document_type: 'scheme_doc',
            source_name: 'Bureau of Indian Standards Official Portal',
            source_url: srv.portalUrl
        };
        await DocumentChunk.findOneAndUpdate({ id: serviceChunk.id }, await withEmbedding(serviceChunk), { upsert: true, returnDocument: 'after' });
    }

    console.log('Successfully seeded MongoDB database with official BIS standards, QCO orders, and services data!');
}

if (require.main === module) {
    seedDatabase()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Seeding error:', err);
            process.exit(1);
        });
}

module.exports = { seedDatabase };
