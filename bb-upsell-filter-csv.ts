import fs from 'fs';
import csv from 'csv-parser';
import { parse as json2csv } from 'json2csv';

interface CsvRow {
  conversationId: string;
  recordingId: string;
  conversationStart: string;
  insights: string;
  [key: string]: string | undefined; // Additional dynamic columns
}

// Function to unmarshall the value
const unmarshall = (value: any): any => {
  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value);
    if (keys.length === 1) {
      return value[keys[0]];
    }
  }
  return value;
}

// Function to process the CSV file
const processCsv = (inputFilePath: string, outputFilePath: string) => {
  const rows: CsvRow[] = [];
  console.log("Start Filtering");
  // Read the CSV file
  fs.createReadStream(inputFilePath)
    .pipe(csv())
    .on('data', (data) => {
      const row: CsvRow = {
        conversationId: data.conversationId,
        recordingId: data.recordingId,
        conversationStart: data.conversationStart,
        insights: data.insights,
        customerNumber: data.customerNumber,
        wrapUp: data.wrapUp,
      };

      // Parse the insights column and add the individual properties as new columns
      try {
        console.log("Processing ", data.insights);
        const insights = JSON.parse(data.insights);
        for (const key in insights) {
          if (insights.hasOwnProperty(key)) {
            row[key] = unmarshall(insights[key]);
          }
        }
      } catch (error) {
        console.error('Error parsing insights:', error);
      }

      rows.push(row);
    })
    .on('end', () => {
      // Determine the fields for the new CSV file
      const fields = ['conversationId', 'recordingId', 'conversationStart', 'customerNumber', 'wrapUp', ...Object.keys(rows[0] || {}).filter(key => key !== 'conversationId' && key !== 'recordingId' && key !== 'conversationStart' && key !== 'customerNumber' && key !== 'wrapUp' && key !== 'insights')];

      // Convert the rows to CSV format
      const csvData = json2csv(rows, { fields });

      // Write the new CSV file
      fs.writeFile(outputFilePath, csvData, (err) => {
        if (err) {
          console.error('Error writing CSV file:', err);
        } else {
          console.log('CSV file created successfully.');
        }
      });
    });
};

// Example usage
const inputFilePath = 'input.csv';
const outputFilePath = 'output.csv';
processCsv(inputFilePath, outputFilePath);
