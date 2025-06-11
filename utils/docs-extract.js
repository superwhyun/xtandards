const mammoth = require("mammoth");
const cheerio = require("cheerio");
const fs = require("fs");

async function extractCellValue(docxPath, title) {
    const { value } = await mammoth.convertToHtml({ path: docxPath });
    const $ = cheerio.load(value);

    let found = false;
    let result = null;

    $("table").each((i, table) => {
        $(table).find("tr").each((j, row) => {
            const cells = $(row).find("td, th");
            cells.each((k, cell) => {
                if ($(cell).text().trim() === title) {
                    // title 셀의 오른쪽 셀 값을 추출
                    const nextCell = cells.eq(k + 1);
                    if (nextCell.length > 0) {
                        result = nextCell.text().trim();
                        found = true;
                        return false; // break cells loop
                    }
                }
            });
            if (found) return false; // break rows loop
        });
        if (found) return false; // break tables loop
    });

    if (result) {
        console.log(`Value next to "${title}": ${result}`);
    } else {
        console.log(`Title "${title}" not found.`);
    }
}

extractCellValue("test.docx", "Title:");