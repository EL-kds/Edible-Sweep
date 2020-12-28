const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const Folder = 'Supermarkets/Ocado/';
const autoscroll = require('puppeteer-autoscroll-down');

(async function main(){

    try {
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();

        await page.goto('https://www.ocado.com/navigation/browse/fresh-chilled-food-20002')

        await page.waitForSelector('ul.section-items');
        const Category_page = await page.$('ul.section-items');
        var Cat_container = await Category_page.$$eval('li > a', a => a.map((elm) => elm.href));
        var Cat_name = await Category_page.$$eval('li > a', a => a.map((elm) => elm.innerText));
        var Folder_cat = Cat_name[0].replace('View all ','')
        console.log(Folder_cat)

        for (let i = 0; i < Cat_container.length; i++) {
            if(Cat_name[i].includes('View')||Cat_name[i].includes('Gifts')){continue;}
            Child_folder_name = Cat_name[i]
            await page.goto(Cat_container[i]);

            await aisle_slct();
        }
       
        async function aisle_slct() {
            await page.waitForSelector('ul.section-items');
            Aisle_page = await page.$('ul.section-items');

            const Aisle_cotainer = await Aisle_page.$$eval('li > a', a => a.map((elm) => elm.href));
            var Aisle_name = await Aisle_page.$$eval('li > a', a => a.map((elm) => elm.innerText));
            
            for(let i = 0; i < Aisle_cotainer.length; i++) {

                var Folder_path = `${Folder+Folder_cat}/${Child_folder_name}/`;
                await fs.mkdirs(Folder_path);

                if(Aisle_name[i].includes('View')){continue};

                const Shelf_page = Aisle_cotainer[i];
                await page.goto(Shelf_page);

                File_path = `${Folder_path+Aisle_name[i]}.csv`;

                Alternate_file_path =`${Folder_path+Aisle_name[i]}/`;

                await Product_slct();
            }
        }

        async function Product_slct() {
            
            total_products =  await page.$eval('div.total-product-number', span => span.innerText.replace(/[a-z]/gi, ''));
            
            if (total_products > 100) {
                await page.waitForSelector('div.grocery-section.level-0 > ul');
                const shelf_page = await page.$('div.grocery-section.level-0 > ul');
                const shelf_container = await shelf_page.$$eval('li > a', a => a.map((elm) => elm.href));
                const shelf_name = await shelf_page.$$eval('li > a', a => a.map((elm) => elm.innerText));
                
                for(let i = 0; i < shelf_container.length; i++) {
                    const Product_page = shelf_container[i];
                    await page.goto(Product_page);

                    Folder_path = Alternate_file_path;
                    const New_folder = await fs.mkdirs(Folder_path);

                    File_path = `${Alternate_file_path+shelf_name[i]}.csv`;
                    console.log(File_path);
                    await fs.writeFile(File_path, 'Name, Price, Per-item, Pack-Size, Availability, URL-Link\n')
                    await collectors();
                }
            }

            async function collectors() {

                await autoscroll(page);

                await page.waitForSelector('ul.fops.fops-regular.fops-shelf');
                const Product_list = await page.$$('ul.fops.fops-regular.fops-shelf > li');

                console.log('\n',File_path,'\n');
                for(let i = 0; i < Product_list.length; i++) {
                  
                   const Product_name = await Product_list[i].$eval('div.fop-item > div.fop-contentWrapper > a > div > div.fop-description > h4', span => span.innerText);
                   const Product_price = await Product_list[i].$eval('div.fop-item > div > a > div.price-group-wrapper > span.fop-price', span => span.innerText);

                   if(await Product_list[i].$('div.fop-item > div > a > div.price-group-wrapper > span.fop-unit-price')){
                        var Price_per_item = await Product_list[i].$eval('div.fop-item > div > a > div.price-group-wrapper > span.fop-unit-price', span => span.innerText);
                    }
                    const Pack_size = await Product_list[i].$eval('div.fop-item > div.fop-contentWrapper > a > div > div.fop-description > span.fop-catch-weight', span => span.innerText.replace( /^\D+/g, ''))
                    
                    await fs.appendFile(File_path, `"${Product_name}","${Product_price}","${Price_per_item}","${Pack_size}"\n`)
                    console.log(Product_name, Product_price, Price_per_item,Pack_size);
                   
                }
            }await collectors();
           
        } await browser.close();

    }catch(e){console.log('error',e)}
})();
