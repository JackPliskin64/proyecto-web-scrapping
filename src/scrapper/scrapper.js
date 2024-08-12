const puppeteer = require("puppeteer")
const fs = require("fs")

const extractPageData = async (page, i) => {
  let arrayProducts = []
  let divWitData = await page.$$("div[class$='product-card']")

  if (divWitData.length === 0) {
    console.log("No se encontraron elementos con 'product-card' en la clase")
    return arrayProducts
  }

  console.log(`Se ha encontrado ${divWitData.length} elementos en la pagina ${i}`)
  console.log("Iniciando el proceso de almacenamiento")

  for (let div of divWitData) {
    try {
      let img = await div.$eval("img", (e) => e.src)
      let price = await div.$eval(".product-card__content span", (e) => e.textContent)
      let name = await div.$eval(".product-card__content h3", (e) => e.textContent)

      arrayProducts.push({ name, price, img })

    } catch (error) {
      console.log("Error al extraer la información:", error)
    }
  }

  return arrayProducts
}

const setNewPage = async (url) => {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(url)
  return page
}

const saveProductsToJson = (products) => {
  const filePath = 'productos.json'
  fs.writeFileSync(filePath, JSON.stringify(products, null, 2))
  console.log(`Se han guardado ${products.length} nuevos productos en productos.json`)
}

const scrapperMaxPage = async (url, pageMax) => {
  const browser = await puppeteer.launch({ headless: false })
  let page = await setNewPage(url)
  const allProducts = []

  for (let currentPage = 1; currentPage <= pageMax; currentPage++) {
    await page.waitForSelector('.product-card__content')

    let productsPerPage = await extractPageData(page, currentPage)
    allProducts.push(...productsPerPage)
    console.log(`Se han almacenado ${productsPerPage.length} nuevos productos`)

    if (currentPage !== pageMax) {
      const nextButton = await page.$('button[aria-label="Página siguiente"]')
      if (!nextButton || (await page.evaluate(button => button.className.endsWith('csBXi'), nextButton))) {
        console.log("No hay más páginas o el botón 'siguiente' no tiene la clase esperada");
        break
      } else {
        console.log('Redirigiendo a la siguiente pagina')
        // Se tiene que cerrar el browser cada vez que se quiere abrir una nueva
        // página, puesto que si reuso el page definido anteriormente con la url
        // nueva, en la página sale un CAPTCHA para prevenir el acceso automatizado
        await page.close()
        await browser.close()
        page = await setNewPage(url + `?page=${currentPage+1}`)
        await page.waitForSelector('.product-card__content')

      }
    }
  }

  console.log(`Todos los ${allProducts.length} productos almacenados`)
  await page.close()
  await browser.close()
  return allProducts
}


const scrapperAll = async (url) => {
  const browser = await puppeteer.launch({ headless: false })
  let page = await setNewPage(url)
  const allProducts = []
  let currentPage = 1
  let morePages = true

  while (morePages) {
    const productsPerPage = await extractPageData(page, currentPage)
    allProducts.push(...productsPerPage)
    console.log(`Se han almacenado ${productsPerPage.length} nuevos productos`)

    const nextButton = await page.$('button[aria-label="Página siguiente"]')
    if (!nextButton || (await page.evaluate(button => button.className.endsWith('csBXi'), nextButton))) {
      console.log("No hay más páginas o el botón 'siguiente' no tiene la clase esperada")
      break
    } else {
      console.log('Redirigiendo a la siguiente pagina')
      currentPage++
      await page.close()
      await browser.close()
      page = await setNewPage(url + `?page=${currentPage}`)
      await page.waitForSelector('.product-card__content')
    }
  }

  console.log(`Todos los ${allProducts.length} productos almacenados`)
  await page.close()
  await browser.close()
  return allProducts
}

const main = async () => {
  const url = "https://www.pccomponentes.com/portatiles/gigabyte"  // URL con key de Gigabyte
  const maxPage = 3  
  const allProducts = await scrapperAll(url)
  const maxPageProducts = await scrapperMaxPage(url, maxPage)
  console.log(`Resultados de la busqueda: ${maxPageProducts.length} productos en la/s ${maxPage} pagina/s y ${allProducts.length} en total`)
  console.log("Vamos a guardar la busqueda completa")
  saveProductsToJson(allProducts)
}

main()

module.exports = { scrapperMaxPage, scrapperAll }
