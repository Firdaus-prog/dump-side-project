import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'json2csv';  // Library to convert JSON to CSV (install with npm i json2csv)

const dynamoClient = new DynamoDBClient({ region: 'your-region' });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Function to fetch data from DynamoDB
const fetchDynamoData = async () => {
  let lastEvaluatedKey;
  const results: any[] = [];

  do {
    const params: ScanCommandInput = {
      TableName: "beethoven-call-analytics-dev-DataTableTable",
      FilterExpression: "conversationType = :type AND attribute_exists(callDuration) AND processingStatus = :status",
      ExpressionAttributeValues: {
        ":type": "astrofibre-upsell",
        ":status": "SUCCESS"  // Filter for processingStatus = SUCCESS
      },
      ExclusiveStartKey: lastEvaluatedKey,
    };

    const data = await docClient.send(new ScanCommand(params));
    results.push(...(data.Items || []));
    lastEvaluatedKey = data.LastEvaluatedKey;

  } while (lastEvaluatedKey);

  return results;
};

// Function to save data to CSV
const saveToCsv = (data: any[]) => {
  const fields = ['conversationId', 'conversationType', 'callDuration', 'processingStatus'];  // Include fields for CSV
  const csv = parse(data, { fields });
  const filePath = path.join(__dirname, 'input.csv');

  fs.writeFileSync(filePath, csv);
  console.log(`Data saved to ${filePath}`);
};

// Main function to download data and save as CSV
const main = async () => {
  try {
    const data = await fetchDynamoData();
    if (data.length > 0) {
      saveToCsv(data);
    } else {
      console.log('No data found');
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Run the script
main();
