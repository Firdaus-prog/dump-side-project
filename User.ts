// Import built in libraries needed.
import http from 'https';
import fs from 'fs';
import * as ExcelJS from 'exceljs';

import platformClient, { Models, UsersApi, AnalyticsApi } from 'purecloud-platform-client-v2';

let batchRequestBody: Models.BatchDownloadJobSubmission = {
    batchDownloadRequestList: []
};

// Set Genesys Cloud objects
const client = platformClient.ApiClient.instance;

// Create API instances
const conversationsApi = new platformClient.ConversationsApi();
const recordingApi = new platformClient.RecordingApi();

const userApi = new platformClient.UsersApi();
const analyticsApi = new platformClient.AnalyticsApi();


async function main() {
    // Get client credentials from environment variables
    const CLIENT_ID = "e838b621-b239-484b-bad1-6b62dd43cc6b";
    const CLIENT_SECRET = "BTO0ufvQvQVEaXkbzTBD5Dw0vcQFU9dsBmHHC9jwpq8";

    // Set environment
    const environment = 'mypurecloud.jp';
    if (environment) {
        client.setEnvironment(environment);
    }

    let dates = "2024-04-25T16:00:00.000Z/2024-04-26T15:59:00.000Z";

    // OAuth input
    const login = await client.loginClientCredentialsGrant(CLIENT_ID, CLIENT_SECRET);
    try {
        // await getUserInfo();
        // test();
        gettingRecordingMetadata(dates, 1)
    } catch (error) {
        console.error(`Error getting user: ${error}`);
        console.error(error);
        throw error;
    }
    
}


// async function getUserInfo() {
//     console.log("Getting user");
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('User IDs');

//     // Add headers
//     const headerRow = worksheet.addRow(['Genesys ID', 'Astro Network ID', 'User Divisions', 'User Roles']);
//     // Make header row bold
//     headerRow.eachCell((cell) => {
//         cell.font = { bold: true };
//     });
//     let userCount = 0;

//     for (let _i = 1; _i <= 56; _i++) {

//         let body = {
//             pageSize: 25,
//             pageNumber: _i,
//         } as UsersApi.getUsersOptions;

//         const userDetails = await userApi.getUsers(body);
//         const users = userDetails['entities'] ?? [];

//         for (let user of users) {
//             let control = true;
//             let roles = [];
//             // console.log(user.id);
//             try {
//                 // Get user details
//                 const userRoles = await userApi.getUserRoles(user.id as string);
//                 roles = userRoles['roles'] ?? [];
//             } catch (error) {
//                 console.error(`Error getting user: ${error}`);
//                 console.error(error);
//                 continue;
//             }

//             for (let role of roles) {
//                 if(control){
//                     const row = worksheet.addRow([user.id, user.email, user?.division?.name, role.name]);
//                     control = false;

//                     // Highlight the row
//                     row.eachCell((cell) => {
//                         cell.fill = {
//                             type: 'pattern',
//                             pattern: 'solid',
//                             fgColor: { argb: 'FFFF00' } // Yellow color
//                         };
//                     });
//                 }
//                 else{
//                     worksheet.addRow([user.id, user.email, user?.division?.name, role.name]);
//                 }

//             }
//             userCount ++;
//             console.log(userCount + "/1400 User Recorded")
//             await new Promise(resolve => setTimeout(resolve, 100));
            
//         }
//     }





//     await workbook.xlsx.writeFile('user_details.xlsx');

//     console.log("User details saved to user_details.xlsx");
// }



async function gettingRecordingMetadata(dates: string, pageNumber: number) {
    console.log('Start batch request process');
    let body = {
        interval: dates,
        segmentFilters: [{ "type": "or", "predicates": [{ "dimension": "mediaType", "value": "voice" }] }, { "type": "or", "predicates": [{ "dimension": "direction", "value": "inbound" }] }],
        conversationFilters: [{ "type": "or", "predicates": [{ "dimension": "originatingDirection", "value": "inbound" }] }, { "type": "and", "predicates": [{ "type": "metric", "metric": "tAnswered", "operator": "exists" }] }],
        paging: { pageSize: 1, pageNumber: pageNumber }
    } as Models.ConversationQuery;

    const conversationDetails = await conversationsApi.postAnalyticsConversationsDetailsQuery(body);
    // console.log(conversationDetails);
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
    
    // // batchRequestBody.batchDownloadRequestList = batchRequestBody.batchDownloadRequestList.slice(0, 10);
    // const batchDownloadJobSubmissionResult = await recordingApi.postRecordingBatchrequests(batchRequestBody);

    // batchRequestBody.batchDownloadRequestList = [];

    // console.log(`Batch request submitted: ${batchDownloadJobSubmissionResult.id}`);
    // const recordings = await getRecordingStatus(batchDownloadJobSubmissionResult);

    // console.log(batchRequestBody);
    const dummy = await recordingApi.getConversationRecordingmetadataRecordingId(batchRequestBody.batchDownloadRequestList[0].conversationId as string, batchRequestBody.batchDownloadRequestList[0].recordingId as string)
    
    let body2 = {
        id: [batchRequestBody.batchDownloadRequestList[0].conversationId as string]
    } as AnalyticsApi.getAnalyticsConversationsDetailsOptions

    
    const conversationMetadata = await analyticsApi.getAnalyticsConversationsDetails(body2);

    const conversations = conversationMetadata['conversations'] ?? [];

    for(let conversation of conversations){
        console.log(conversation.participants);
    }



    // for (const recording of recordings?.results ?? []) {
    //     if (recording.errorMsg) {
    //         console.log(`Skipping recording ${recording.id}. Reason: ${recording.errorMsg}`);
    //         continue;
    //     } else {
    //         await downloadRecording(recording);
    //     }
    // }
}


// Get all the recordings metadata of the conversation and add it to the global batch request object
async function addConversationRecordingsToBatch(conversationId: string) {
    const recordingsData = await recordingApi.getConversationRecordingmetadata(conversationId);
 
    // console.log(recordingsData);
    for (let recording of recordingsData) {
        if (recording.media === "audio") {
            let batchRequest: Models.BatchDownloadRequest = {};
            batchRequest.conversationId = recording.conversationId;
            batchRequest.recordingId = recording.id;
            batchRequestBody.batchDownloadRequestList.push(batchRequest);
            // console.log(`Added recording ${recording.id} for conversation ${conversationId} to batch request`);
        }
    }
}










main(); 