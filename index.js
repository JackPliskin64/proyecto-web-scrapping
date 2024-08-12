const { scrapper, scrapperMaxPage, scrapperAll } = require("./src/scrapper/scrapper");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const findByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    let pageMax = req.query.pageMax;
    let products = []
    if(pageMax === undefined){
      console.log(`Iniciando la búsqueda en la categoría ${key} para todas la/s página/s`)
      products = await scrapperAll(`https://www.pccomponentes.com/portatiles/${key}`);
    } else {
      console.log(`Iniciando la búsqueda en la categoría ${key} para ${pageMax} página/s`)
      products = await scrapperMaxPage(`https://www.pccomponentes.com/portatiles/${key}`, pageMax);
    }
    console.log(products)
    return res.status(200).json(products);
  } catch (error) {
    console.log(error)
    return res.status(400).json("Not found");
  }
};

app.use("/api/v1/portatiles/:key", findByKey);

app.listen(3000, () => {
  console.log("http://localhost:3000");
});