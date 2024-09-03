import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const REGION = "ap-southeast-1"; // e.g., "us-east-1"
const TABLE_NAME = "beethoven-call-analytics-dev-DataTableTable"; // e.g., "Conversations"

const dbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(dbClient);

async function deleteItems() {
  try {
    let count = 0;
    let scanned = 0;
    let lastEvaluatedKey= {
      pk: 'conversation#460de13e-d833-42f7-8fe4-25e25e560d5b',
      sk: 'recording#e892bde4-6b46-4e4e-afa5-eaa0cf8d6cd3'
    };
    do {
      const scanParams = {
        TableName: TABLE_NAME,
        FilterExpression: "conversationType = :t",
        ExpressionAttributeValues: {
          ":t": "bb-upsell"
        },
        ExclusiveStartKey: lastEvaluatedKey
      };

      const scanCommand = new ScanCommand(scanParams);
      const scanResult = await ddbDocClient.send(scanCommand);
      scanned += scanResult.ScannedCount ?? 0;
      console.log(scanned, " item scanned.");
      if (scanResult.Items) {
        for (const item of scanResult.Items) {
          const deleteParams = {
            TableName: TABLE_NAME,
            Key: {
              pk: item.pk,
              sk: item.sk // Include sk if your table has a sort key
            }
          };

          const deleteCommand = new DeleteCommand(deleteParams);
          await ddbDocClient.send(deleteCommand);
          count += 1;
          console.log(`Deleted item with pk: ${item.pk}`);
          console.log(count, " item deleted");
        }
      }

      lastEvaluatedKey = scanResult.LastEvaluatedKey ?? {pk:"", sk:""};

    } while (lastEvaluatedKey);

    console.log("Deletion process completed.");
  } catch (error) {
    console.error("Error deleting items:", error);
  }
}

deleteItems();
