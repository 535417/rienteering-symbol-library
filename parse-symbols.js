const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const ROOT = process.cwd();

const DATA_DIR = path.join(ROOT, "data");
const IMG_DIR = path.join(ROOT, "img");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

if (!fs.existsSync(IMG_DIR)) {
  fs.mkdirSync(IMG_DIR);
}

const htmlFiles = fs
  .readdirSync(ROOT)
  .filter((f) => f.toLowerCase().endsWith(".htm") || f.toLowerCase().endsWith(".html"));

if (htmlFiles.length === 0) {
  console.log("没有找到 htm/html 文件");
  process.exit(0);
}

const allSymbols = [];

for (const file of htmlFiles) {
  console.log(`\n处理: ${file}`);

  const standard = path.basename(file, path.extname(file));

  const standardImgDir = path.join(IMG_DIR, standard);

  if (!fs.existsSync(standardImgDir)) {
    fs.mkdirSync(standardImgDir);
  }

  const html = fs.readFileSync(file, "utf8");

  const $ = cheerio.load(html);

  let exported = 0;

  $("img").each((index, img) => {
    const src = $(img).attr("src");

    if (!src) return;

    if (!src.startsWith("data:image")) return;

    const titleElement = $(img)
      .closest("tr")
      .find("b")
      .first();

    if (!titleElement.length) return;

    const titleText = titleElement.text().trim();

    const match = titleText.match(/^([\d.]+)\s+(.*)$/);

    if (!match) return;

    const id = match[1];
    const name = match[2];

    let description = "";

    const descNode = $(img)
      .closest("tr")
      .nextAll()
      .find("div")
      .first();

    if (descNode.length) {
      description = descNode.text().replace(/\s+/g, " ").trim();
    }

    const base64 = src.split(",")[1];

    const imageFile = `${id}.png`;

    const imagePath = path.join(
      standardImgDir,
      imageFile
    );

    fs.writeFileSync(
      imagePath,
      Buffer.from(base64, "base64")
    );

    allSymbols.push({
      standard,
      id,
      name_en: name,
      description,
      image: `img/${standard}/${imageFile}`
    });

    exported++;
  });

  console.log(`导出图例: ${exported}`);
}

fs.writeFileSync(
  path.join(DATA_DIR, "symbols.json"),
  JSON.stringify(allSymbols, null, 2),
  "utf8"
);

console.log("\n完成");
console.log(`总图例数: ${allSymbols.length}`);
console.log("JSON输出: data/symbols.json");