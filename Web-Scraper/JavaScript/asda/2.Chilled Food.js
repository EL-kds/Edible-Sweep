const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const folder = 'Supermarkets/Iceland/';
(async function main(){
    try {
        const browser = await puppeteer.launch({headless: true});
        const page = await browser.newPage();
        page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 12_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/81.0.4044.124 Mobile/15E148 Safari/604.1');
        
        await page.goto('https://www.iceland.co.uk/fresh');

        await page.waitForSelector('div.search-suggestions-content');
        const Frozen_food_page = await page.$('div.search-suggestions-content')
        var Product_btn = await Frozen_food_page.$$eval('a', a => a.map((elm) => elm.href));
        

        for(let i = 0; i < Product_btn.length; i++) { 
            await page.goto(Product_btn[i]);

            //create new folder with elements name
            await page.waitForSelector('div.clearfix');
            const folder_name = await page.$eval('div.clearfix > nav > ol', li => li.innerText);
            var Folder_path = folder_name.replace(/[\r\n]/g, "/").replace('Home/','').concat('/');
            const New_folder = await fs.mkdirs(folder+Folder_path)
            console.log(Folder_path);

            await Ailse_select();
        }

        async function Ailse_select() {
            await page.waitForSelector('div.refinement-content');
            await page.waitForSelector('div.top-options')
            //const Product_lenght_check = await page.$eval('div.top-options > div.item-results', div => div.innerText.replace(' 1 ','').replace(/\D/g,''));
            

            if (await page.$('[id="category-level-1"]')){
                const Product_page = await page.$('div.refinement-content > ul');
                const Aisle_selector_btn = await Product_page.$$eval('a', a => a.map((elm) => elm.href));
                for (let i = 0; i < Aisle_selector_btn.length; i++){ // need to change  <<<<<<<<<<<<<<<<<<<<<<<<<<<<

                    //console.log(page.url());
                    if (Aisle_selector_btn[i] != Product_btn[i] )
                    {
                        //console.log(Aisle_selector_btn[i], Product_btn[i]);
                        const Product = Aisle_selector_btn[i];
                        await page.goto(Product); // go to urls on the webpage
                        await Product_slct();
                    } else{await Product_slct();}
                    
                    
                }
            }else {await Product_slct();}

            
            

            
            async function Product_slct() {
                //create a new file 
                await page.waitForSelector('div.clearfix')
                const File_name = await page.$$eval('div.clearfix > nav > ol > li > a', a => a.map((elm)=> elm.innerText));
                
                const File_path = `${folder + Folder_path + File_name[File_name.length - 1]}.csv`;
                await fs.writeFile(File_path, 'Name, Price, Per-item, Pack-Size, Availability\n');

                //collecting Product Information
                await page.waitForSelector('div.product-tile')
                const Product_list = await page.$$('div.product-tile');// find every li in the ul selector
                const Product_list_length = await page.$$('div.primary-content > div > ul > li > div > div > div > a.name-link'); // for the loop length over all the product in the first element 


                for(let i = 0; i < Product_list_length.length; i++){
                    const Product_name = await Product_list[i].$eval(' div > div > a.name-link > span', span => span.innerText);
                    const Product_price = await Product_list[i].$eval(' div > div.product-pricing > span', span => span.innerText);
                    const Price_per_item = await Product_list[i].$eval(' div > div.product-pricing > div', span => span.innerText);
                    const Pack_size = Product_name.replace( /^\D+/g, '')
                    //console.log(Product_name, Product_price, Price_per_item, Pack_size);
                    
                    

                    await fs.appendFile(File_path, `"${Product_name}", "${Product_price}", "${Price_per_item}","${Pack_size}"\n`);

                }//console.log(page.url(), '\n');

                if (await page.$('ul.pagination')){


                    await page.waitForSelector('ul.pagination');
                    const Next_page = await page.$('ul.pagination > li > a.page-next');
                    const Last_page = await page.$eval('ul.pagination > li > span.desc', span => span.innerText.replace('Page 1 of ', ''));
                    

                    for(let i = 1; i < Last_page; i++){

                        const Next_page = await (await page.$('ul.pagination > li > a.page-next')).click();//click button to the next page
                        await page.waitForTimeout(2000)

                        //collecting Product Information
                        await page.waitForSelector('div.product-tile')
                        const Product_list = await page.$$('div.product-tile');// find every li in the ul selector
                        const Product_list_length = await page.$$('div.primary-content > div > ul > li > div > div > div > a.name-link'); // for the loop length over all the product in the first element 
                        console.log(page.url(), '\n');

                        for(let i = 0; i < Product_list_length.length; i++){
                            const Product_name = await Product_list[i].$eval(' div > div > a.name-link > span', span => span.innerText);
                            const Product_price = await Product_list[i].$eval(' div > div.product-pricing > span', span => span.innerText);
                            const Price_per_item = await Product_list[i].$eval(' div > div.product-pricing > div', span => span.innerText);
                            const Pack_size = Product_name.replace( /^\D+/g, '')
                            //console.log(Product_name, Product_price, Price_per_item, Pack_size);

                            await fs.appendFile(File_path, `"${Product_name}", "${Product_price}", "${Price_per_item}","${Pack_size}"\n`);
                        }
                    }
                }
            } 
        } await browser.close();
    }catch(e) {
        console.log('error',e);
    }
})();