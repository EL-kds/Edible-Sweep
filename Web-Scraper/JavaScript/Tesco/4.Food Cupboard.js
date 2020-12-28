const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const Folder = 'Supermarkets/Tesco/';

(async function main() {

    try {

        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 12_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/81.0.4044.124 Mobile/15E148 Safari/604.1');

        await page.goto('https://www.tesco.com/groceries/en-GB/shop/food-cupboard/all');
        const Folder_Heading = await page.$eval('h1.heading.query', h1 => h1.innerText); //locate heading text for folder
        
        await page.waitForSelector('ul.selects-row');
        const Category_page = await page.$('ul.selects-row > li > div > div > ul > li.current-filters > ul'); // identifying category elements
        const Cat_button = await (await page.$('li > div.filter-select-container > button')).click(); //selecting the category button

        if (await Category_page.$('li.more-filters--container')){ // check if more optons are available
            
            const More_options_btn = await (await page.$('li.more-filters--container > button.more-filters')).click(); //button for showing more categories
        };

        var Cat_selector_btn = await Category_page.$$eval('li.filter-option__container > div > label > a', a => a.map((elm) => elm.href)); // get all href links from the container
        
        for (let i = 0; i < Cat_selector_btn.length; i++) {
            
            await page.goto(Cat_selector_btn[i]); // goto category pages

            //create a new folder 
            const Folder_Cat = await page.$eval('li.applied-filter > a', span => span.innerText);// locate cat text for folder
            var Folder_path = `${Folder+Folder_Heading}/${Folder_Cat}/`;
            const New_folder = await fs.mkdirs(Folder_path);
            console.log(page.url());

            await aisle_slct();
        }

        async function aisle_slct(){

            await page.waitForSelector('ul.selects-row');
            const Aisle_page = await page.$('ul.selects-row > li > div > div > ul > li.current-filters[data-auto="aisle"] > ul'); //identifying category elements.

            if (await Aisle_page.$('li.more-filters--container')){ // check if more optons are available
            
                await (await page.$('li.more-filters--container > button.more-filters')).click(); //button for showing more categories
            }; 

            const Aisle_cat_btn = await Aisle_page.$$eval('li.filter-option__container > div > label > a', a => a.map((elm) => elm.href)); // get all href links from the container
            
            for(let i = 0; i < Aisle_cat_btn.length; i++){
                const Shelf_Page = Aisle_cat_btn[i];
                await page.goto(Shelf_Page);
                await Product_slct();
            }
        }

        async function Product_slct(){
            await page.waitForSelector('li.applied-filter');
            const File_name = await page.$$eval('li.applied-filter > a', span => span.map((elm)=> elm.innerText));
            const File_path  = `${Folder_path+File_name[1]}.csv`;
            await fs.writeFile(File_path, 'Name, Price, Per-item, Pack-Size, Availability\n');
            console.log(page.url());
            

            async function collector(){
                await page.waitForSelector('ul.product-list.grid');
                const Product_list = await page.$$('ul.product-list.grid > li');
                
                for(let i = 0; i < Product_list.length; i++) {
                    const Product_name = await Product_list[i].$eval('div.tile-content > div > div > h3', a => a.innerText);
                    if (await Product_list[i].$('div.tile-content > div > div > div.product-info-message-section.unavailable-messages')){
                        console.log(Product_name)
                        continue;
                    };
                    const Product_price = await Product_list[i].$eval('div.tile-content > div > form > div > div > div > div', div => div.innerText.replace(' ',''));
                    const Price_per_item = await Product_list[i].$eval('div.tile-content > div > form > div > div > div.price-per-quantity-weight', div => div.innerText.replace('/', ' '))
                    const Pack_size = Product_name.replace( /^\D+/g, '')

                    await fs.appendFile(File_path, `"${Product_name}","${Product_price}","${Price_per_item}","${Pack_size}"\n`)
                    
                }
            }

            if (await page.$('a[aria-label="Go to results page"].pagination--button.prev-next')) {
                
                while(!await page.$('a.pagination--button.prev-next.disabled[aria-label="Go to results page"]')) {
                    const Next_page  = await (await page.$('a.pagination--button.prev-next[aria-label="Go to results page"]')).click();
                    await page.waitForTimeout(2500);
                    console.log(page.url());
                    
                }
            }await collector();

        }await browser.close();
 
    }catch(e) {
        console.log('error', e)
    }

})();