const puppeteer = require('puppeteer');
const autoscroll = require('puppeteer-autoscroll-down');
const path = require('path');
//const scrollPageToBottom = require('index');
const fs = require('fs-extra');
const Folder = 'Supermarkets/Aldi/';

(async function main() {
    try{

        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        
        await page.goto('https://www.aldi.co.uk/c/groceries/food-cupboard');
        const Folder_heading = await page.$eval('h1.category-name.category-name--groceries', h1 => h1.innerText.replace(/ *\([^)]*\) */g, "").trim());
        console.log(Folder_heading);
        //selecting butons from category 
        await page.waitForSelector('ul.category-facets__list.category-facets__list--facet');
        const Category_page = await page.$('ul.category-facets__list.category-facets__list--facet')
        var Cat_container = await Category_page.$$eval('li > a', a => a.map((elm) => elm.href));
        console.log(Cat_container)

        for(let i = 0; i < Cat_container.length; i++) {
            await page.goto(Cat_container[i]);
            var reloader = Cat_container[i];
            
            var Folder_cat = await page.$eval('h1.category-name', h1 => h1.innerText.replace(/ *\([^)]*\) */g, "").trim());
            var Folder_path = `${Folder+Folder_heading}/${Folder_cat}/`;
            const New_folder = await fs.mkdirs(Folder_path);
            console.log(page.url());

            await aisle_slct();
        };

        async function aisle_slct() {
            async function aisle_caller() {
                await page.waitForSelector('ul.category-facets__list.category-facets__list--facet.js-facet-list.expanded');
               
                if(await page.$('ul.category-facets__list.category-facets__list--facet.js-facet-list.expanded[data-facet-name="grocerytype"]')){
                    Aisle_page = await page.$$('ul.category-facets__list.category-facets__list--facet.js-facet-list.expanded[data-facet-name="grocerytype"]');
                    test = await Aisle_page[1].$('li.category-facets__item.category-facets__item--toggler.js-facet-collapsibleItem  >a');

                    Aisle_check_btn = await Aisle_page[1].$$('li.category-facets__item.category-facets__item--facet.js-facet-item');

                }else{Aisle_check_btn = 'o';}
            }await aisle_caller();

            for(let i = 0 ; i < Aisle_check_btn.length; i++) {
                
                await aisle_caller();
                
                if(i > 6){ // to temporary fix for home page bug
                    if (test){test.click();await page.waitForTimeout(3000);}
                }
                
                if(Aisle_check_btn.length > 1){
                    const checker = await Aisle_check_btn[i].$('label');
                    checker.click();
                }

                //create a new file 
                if(Aisle_check_btn.length > 1){
                    var File_name = await Aisle_check_btn[i].$eval('label', label => label.innerText.replace(/ *\([^)]*\) */g, "").trim());
                    }else{var File_name = Folder_cat}
                    File_path = `${Folder_path+File_name}.csv`;
                    await fs.writeFile(File_path, 'Name, Price, Per-item, Pack-Size, Availability\n');
                    console.log(File_name)

                await page.waitForTimeout(3000)

                await product_slct();

                await page.waitForTimeout(2500);
                await page.goto(reloader)
            }   
        }

        async function product_slct() {

                await page.waitForSelector('div.col-xs-12 > div.category-item');
                await autoscroll(page);
                const Product_list = await page.$$('div.col-xs-12 > div.category-item.hover-item.js-category-item.category-item--outofstock')
                
                for(let i = 0; i < Product_list.length; i++) {
                    const Product_name = await Product_list[i].$eval('ul > li.category-item__title', li => li.innerText);
                    const Product_price = await Product_list[i].$eval('ul > li.category-item__price', li => li.innerText);
                    const Price_per_item = await Product_list[i].$eval('ul > li.category-item__pricePerUnit', li => li.innerText);
                    const Pack_size = Product_name.replace( /^\D+/g, '');
                    
                    await fs.appendFile(File_path, `"${Product_name}","${Product_price}","${Price_per_item}","${Pack_size}"\n`)
                }
        }await browser.close();

    }catch(e){
        console.log('error', e);
    }

})();