import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, DeleteCommand, ScanCommandOutput } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'ap-southeast-1' }); // Replace with your AWS region
const docClient = DynamoDBDocumentClient.from(client);
const tableName = 'beethoven-call-analytics-dev-DataTableTable'; // Replace with your DynamoDB table name

async function deleteItemsWithConversationType(conversationType: string): Promise<void> {
  const scanParams = {
    TableName: tableName,
    FilterExpression: 'conversationType = :convType',
    ExpressionAttributeValues: {
      ':convType': conversationType,
    },
  };

  try {
    let itemsToDelete: any[] = [];
    let lastEvaluatedKey: undefined | Record<string, any>;

    console.log(`Starting scan for items with conversationType: '${conversationType}'`);

    do {
      const scanCommand = new ScanCommand({ ...scanParams, ExclusiveStartKey: lastEvaluatedKey });
      const scanResult: ScanCommandOutput = await docClient.send(scanCommand);
      
      // Log the number of items returned in this scan
      console.log(`Scan returned ${scanResult.Items ? scanResult.Items.length : 0} items.`);

      // Collect items to delete
      itemsToDelete = itemsToDelete.concat(scanResult.Items || []);
      lastEvaluatedKey = scanResult.LastEvaluatedKey; // Update the last evaluated key for pagination

      // Log whether there are more items to scan
      if (lastEvaluatedKey) {
        console.log('More items to scan, fetching next page...');
      } else {
        console.log('No more items to scan.');
      }
    } while (lastEvaluatedKey);

    // Delete each item
    if (itemsToDelete.length > 0) {
      console.log(`Preparing to delete ${itemsToDelete.length} items with conversationType '${conversationType}'.`);

      const deletePromises = itemsToDelete.map(item => {
        const deleteParams = {
          TableName: tableName,
          Key: {
            // Replace 'pk' with your actual partition key name
            pk: item.pk // Assuming 'pk' is the partition key of your table
          },
        };

        const deleteCommand = new DeleteCommand(deleteParams);
        return docClient.send(deleteCommand).then(() => {
          console.log(`Deleted item with pk: ${item.pk}`);
        });
      });

      await Promise.all(deletePromises);
      console.log(`Successfully deleted ${itemsToDelete.length} items with conversationType '${conversationType}'.`);
    } else {
      console.log(`No items found with conversationType '${conversationType}'.`);
    }
  } catch (error) {
    console.error('Error deleting items:', error);
  }
}

// Usage
deleteItemsWithConversationType('dbb-save-churn')
  .then(() => console.log('Deletion process completed.'))
  .catch(err => console.error('Error during deletion process:', err));
