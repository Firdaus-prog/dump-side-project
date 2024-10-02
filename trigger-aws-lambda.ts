import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { format, addDays } from "date-fns"; // Helper to format dates and add days

// Initialize the Lambda client
const lambdaClient = new LambdaClient({ region: 'ap-southeast-1' });

// Function to trigger the Lambda with the event for a specific date
const triggerLambdaForDate = async (date: string) => {
  const eventPayload = {
    type: "astrofibre-upsell",
    date: date,   // Set the date dynamically
    refresh: true,
  };

  const params = {
    FunctionName: "beethoven-call-analytics-dev-BBUpsellRecordingFunction",  // Replace with your Lambda function name
    Payload: Buffer.from(JSON.stringify(eventPayload)),
    InvocationType: "Event", // Async invocation
  };

  try {
    console.log(`Triggering Lambda for date: ${date}...`);
    const command = new InvokeCommand(params);
    const response = await lambdaClient.send(command);
    console.log(`Lambda triggered successfully for date: ${date}`, response);
  } catch (error) {
    console.error(`Error triggering Lambda for date: ${date}`, error);
  }
};

// Function to loop through date range and trigger Lambda for each date
const triggerLambdaForDateRange = async () => {
  let currentDate = new Date("2024-08-11");
  const endDate = new Date("2024-10-01");

  while (currentDate <= endDate) {
    const formattedDate = format(currentDate, "yyyy-MM-dd");
    await triggerLambdaForDate(formattedDate);  // Trigger Lambda for the current date
    currentDate = addDays(currentDate, 1);      // Move to the next day
  }

  console.log("All dates processed.");
};

// Run the function
triggerLambdaForDateRange();
