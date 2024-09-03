import * as XLSX from 'xlsx';
import * as fs from 'fs';

function getUniqueValuesFromColumn(filePath: string, columnName: string): string[] {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert the sheet to JSON
    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

    const uniqueValuesSet: Set<string> = new Set();

    // Iterate through the rows and extract values from the specified column
    jsonData.forEach((row: any) => {
        if (row[columnName]) {
            const values = row[columnName].split('/').map((val: string) => val.trim());
            values.forEach((value: string) => uniqueValuesSet.add(value));
        }
    });

    // Convert the set to an array
    const uniqueValuesArray = Array.from(uniqueValuesSet);

    return uniqueValuesArray;
}

function saveArrayToFile(array: string[], filePath: string) {
    const fileContent = JSON.stringify(array);
    fs.writeFileSync(filePath, fileContent, 'utf8');
}

// Example usage
const excelFilePath = './OMNI AF - TV Pack Upsell.xlsx';
const columnName = 'Dispo';
const outputFilePath = './data/wrapUpCode.txt';
console.log("LALALA");
let fileName = 'REJECTION/01139095360_OAA01584_2024-07-18-12-44-38.mp3';
fileName = fileName.slice(fileName.indexOf('/') + 1);
console.log(fileName);



// const uniqueValues = getUniqueValuesFromColumn(excelFilePath, columnName);
// saveArrayToFile(uniqueValues, outputFilePath);

// console.log(`Unique values have been saved to ${outputFilePath}`);
