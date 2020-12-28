const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const Folder = 'Supermarkets/Morrison/';
const autoscroll = require('puppeteer-autoscroll-down');

(async function main() {
    try{

        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();

        await page.goto('https://groceries.morrisons.com/browse/fresh-176739');
        
        if(!await page.$('ul.c-sis-nav')) {
            
            await page.waitForSelector('div.grocery-section.level-0 > ul')
            const Category_page = await page.$(('div.grocery-section.level-0 > ul'))
            var Cat_container = await Category_page.$$eval('li > a', a => a.map((elm) => elm.href));

            
        }else {

            await page.waitForSelector('ul.c-sis-nav');
            const Category_page = await page.$('ul.c-sis-nav');
            var Cat_container = await Category_page.$$eval('li > a', a => a.map((elm) => elm.href));

        }
        
        for (var i = 0; i < Cat_container.length; i++) {
            await page.goto(Cat_container[i]);
            
            var Folder_cat = await page.$$eval('ul.bc-desktopBreadcrumbsWithMenu__breadcrumbs > li', li => li.map((elm) =>elm.innerText));
            var Folder_path = `${Folder+Folder_cat[1]}/${Folder_cat[2]}/`;
            console.log(Folder_path)
            const New_folder = await fs.mkdirs(Folder_path)

            await aisle_slct();
        }

        async function aisle_slct() {

            if(await page.$('div.grocery-section.level-0')) {
                await page.waitForSelector('div.grocery-section.level-0');
                Aisle_page = await page.$('div.grocery-section.level-0');

                const Aisle_cat_btn = await Aisle_page.$$eval('li > a', a => a.map((elm) => elm.href));
                File_name = await Aisle_page.$$eval('li > a', a => a.map((elm) => elm.innerText));
            

                for(let i = 0; i < Aisle_cat_btn.length; i++) {
                    const Shelf_page = Aisle_cat_btn[i];
                    await page.goto(Shelf_page);

                    var File_path = `${Folder_path+File_name[i].trim()}.csv`;

                    await Product_slct();
                }

            }else {
                File_name = Folder_cat[2];
                var File_path = `${Folder_path+File_name}.csv`;
                await Product_slct();
            }
            

        async function Product_slct() {

            await fs.writeFile(File_path, 'Name, Price, Per-item, Pack-Size, Availability, URL-Link\n');
            
            async function collectors() {
                await autoscroll(page);
                await page.waitForSelector('ul.fops.fops-regular.fops-shelf');
                const Product_list = await page.$$('ul.fops.fops-regular.fops-shelf > li');
                
                console.log(File_path);
                for(let i = 0; i < Product_list.length; i++) {
                   
                    const Product_name = await Product_list[i].$eval('div.fop-item > div.fop-contentWrapper > a > div > div.fop-description > h4', span => span.innerText);
                    const Product_price = await Product_list[i].$eval('div.fop-item > div > a > div.price-group-wrapper > span.fop-price', span => span.innerText);

                    if(await Product_list[i].$('div.fop-item > div > a > div.price-group-wrapper > span.fop-unit-price')){
                        var Price_per_item = await Product_list[i].$eval('div.fop-item > div > a > div.price-group-wrapper > span.fop-unit-price', span => span.innerText);
                    }
                    
                    const Pack_size = await Product_list[i].$eval('div.fop-item > div.fop-contentWrapper > a > div > div.fop-description > span.fop-catch-weight', span => span.innerText.replace( /^\D+/g, ''))
                    
                    await fs.appendFile(File_path, `"${Product_name}","${Product_price}","${Price_per_item}","${Pack_size}"\n`)

                    
                    console.log(Product_name, Product_price, Price_per_item, Pack_size);
                }
            }console.log('\n');
            await collectors(); 
        }


        } await browser.close();


    }catch(e){console.log('error',e);}
})();