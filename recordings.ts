// Import built in libraries needed.
import http from 'https';
import fs from 'fs';
import platformClient, { Models } from 'purecloud-platform-client-v2';

let batchRequestBody: Models.BatchDownloadJobSubmission = {
    batchDownloadRequestList: []
};

// Set Genesys Cloud objects
const client = platformClient.ApiClient.instance;

// Create API instances
const conversationsApi = new platformClient.ConversationsApi();
const recordingApi = new platformClient.RecordingApi();

async function main() {
    // Get client credentials from environment variables
    const CLIENT_ID = "e838b621-b239-484b-bad1-6b62dd43cc6b";
    const CLIENT_SECRET = "BTO0ufvQvQVEaXkbzTBD5Dw0vcQFU9dsBmHHC9jwpq8";

    // Set environment
    const environment = 'mypurecloud.jp';
    if (environment) {
        client.setEnvironment(environment);
    }

    // OAuth input
    const login = await client.loginClientCredentialsGrant(CLIENT_ID, CLIENT_SECRET);
    let dates = "2024-04-25T16:00:00.000Z/2024-04-26T15:59:00.000Z";
    
    for (let pageNum = 3; pageNum <= 5; pageNum++) {
        try {
            await downloadAllRecordings(dates, pageNum);
        } catch (error) {
            console.error(`Error downloading recordings: ${error}`);
            console.error(error);
            throw error;
        }
        
    }
}

async function downloadAllRecordings(dates: string, pageNumber: number) {
    console.log('Start batch request process');
    let body = {
        interval: dates,
        segmentFilters: [{ "type": "or", "predicates": [{ "dimension": "mediaType", "value": "voice" }] }, { "type": "or", "predicates": [{ "dimension": "direction", "value": "inbound" }] }],
        conversationFilters: [{ "type": "or", "predicates": [{ "dimension": "originatingDirection", "value": "inbound" }] }, { "type": "and", "predicates": [{ "type": "metric", "metric": "tAnswered", "operator": "exists" }] }],
        paging: { pageSize: 100, pageNumber: pageNumber }
    } as Models.ConversationQuery;

    const conversationDetails = await conversationsApi.postAnalyticsConversationsDetailsQuery(body);

    if (conversationDetails && conversationDetails.conversations) {
        let conversationDetail: Promise<void>[] = [];
        for (let conversation of conversationDetails.conversations) {
            if (conversation.conversationId) {
                conversationDetail.push(addConversationRecordingsToBatch(conversation.conversationId));
            }
        }
        await Promise.all(conversationDetail);
    }
    console.log("Crafted request with all recording IDs. Submitting batch request now...");
    
    // batchRequestBody.batchDownloadRequestList = batchRequestBody.batchDownloadRequestList.slice(0, 10);
    const batchDownloadJobSubmissionResult = await recordingApi.postRecordingBatchrequests(batchRequestBody);

    batchRequestBody.batchDownloadRequestList = [];

    console.log(`Batch request submitted: ${batchDownloadJobSubmissionResult.id}`);
    const recordings = await getRecordingStatus(batchDownloadJobSubmissionResult);

    for (const recording of recordings?.results ?? []) {
        if (recording.errorMsg) {
            console.log(`Skipping recording ${recording.id}. Reason: ${recording.errorMsg}`);
            continue;
        } else {
            await downloadRecording(recording);
        }
    }
}


// Get all the recordings metadata of the conversation and add it to the global batch request object
async function addConversationRecordingsToBatch(conversationId: string) {
    const recordingsData = await recordingApi.getConversationRecordingmetadata(conversationId);
    for (let recording of recordingsData) {
        if (recording.media === "audio") {
            let batchRequest: Models.BatchDownloadRequest = {};
            batchRequest.conversationId = recording.conversationId;
            batchRequest.recordingId = recording.id;
            batchRequestBody.batchDownloadRequestList.push(batchRequest);
            console.log(`Added recording ${recording.id} for conversation ${conversationId} to batch request`);
        }
    }
}


// Plot conversationId and recordingId to request for batchdownload Recordings
async function getRecordingStatus(recordingBatchRequest: Models.BatchDownloadJobSubmissionResult) {
    if (!recordingBatchRequest.id) {
        throw new Error('Batch request ID is missing');
    }
    let continueCheckingStatus = true;
    while (continueCheckingStatus) {
        const result = await recordingApi.getRecordingBatchrequest(recordingBatchRequest.id);
        if (result.expectedResultCount !== result.resultCount) {
            console.log(`Recording status: ${result.resultCount} / ${result.expectedResultCount}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            console.log('All recordings are ready for download');
            continueCheckingStatus = false;
            return result;
        }
    }
}

// Get extension of every recording
function getExtension(recording: Models.BatchDownloadJobResult) {
    // Store the contentType to a variable that will be used later to determine the extension of recordings
    let contentType = recording.contentType ?? '';
    // Split the text and gets the extension that will be used for the recording
    let ext = String(contentType.split('/').slice(-1));

    // For the JSON special case
    if (ext.length >= 4) {
        console.log('length' + ext.length);
        ext = ext.substring(0, 4);
        return ext;
    } else {
        return ext;
    }
}


// Download Recordings
async function downloadRecording(recording: Models.BatchDownloadJobResult) {
    console.log('Downloading now. Please wait...');
    let ext = getExtension(recording);
    let conversationId = recording.conversationId;
    let recordingId = recording.recordingId;
    let recordingUrl = recording.resultUrl ?? '';
    let targetDirectory = './recordings/';
    let fileName = conversationId + '_' + recordingId;

    await downloadFile(recordingUrl, `${targetDirectory}${fileName}.${ext}`);
}

function downloadFile(url: string, filePath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        http.get(url, response => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file. Status code: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', error => {
            fs.unlink(filePath, () => reject(error));
        });
    });
}

main();