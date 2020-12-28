const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const folder = 'Supermarkets/Asda/';
(async function main() {
    try {
        
        const browser = await puppeteer.launch({headless: false});
        const page = await browser.newPage();
        
        await page.goto('https://groceries.asda.com/cat/laundry-household/104074');
        

        //selecting Product button
        await page.waitForSelector('ul.taxonomy-explore__list'); //wait for page to load element
        const Fresh_food_page = await page.$('ul.taxonomy-explore__list');
        const Product_btn = await Fresh_food_page.$$eval('a', a => a.map((elm) => elm.href)); // getting href inner element link from ul class
        
        for(let i = 0; i < Product_btn.length; i++){
            await page.goto(Product_btn[i]);
            await page.waitForSelector('main.layout__main');
            const folder_name1 = await page.$eval('main.layout__main > div > a', span => span.innerText);
            const folder_name2 = await page.$eval('main.layout__main > h1', h1 => h1.innerText);

            var New_folder_path = folder_name1.replace('breadcrumb\n','').replace(' /',"/").concat(folder_name2,'/');
            console.log(New_folder_path);
            const New_Folder = await fs.mkdirs(folder+New_folder_path);// create a new folder

            await btn_Select();
        }
  
        async function btn_Select(){
            
            await page.waitForSelector('ul.taxonomy-explore__list'); //wait for page to load element
            const Product_page = await page.$('ul.taxonomy-explore__list');
            const Aisle_selector_btn = await Product_page.$$eval('a', a => a.map((elm) => elm.href));// getting href inner element link from ul class
            

            for (let i = 0; i < Aisle_selector_btn.length; i++) {
                
                const Product = Aisle_selector_btn[i];
                await page.goto(Product); // go to urls on the webpage
                
                //create a new file 
                await page.waitForSelector('h1');
                const File_name = await page.$eval('h1', h1 => h1.innerText); // locate file name element
                const File_path = `${folder + New_folder_path + File_name}.csv`;
                await fs.writeFile(File_path, 'Name, Price, Per-item, Pack-Size\n');
                console.log(File_path);
                

                //collecting producting information
                await page.waitForSelector('ul.co-product-list__main-cntr');
                const Prondcut_list = await page.$$('ul.co-product-list__main-cntr > li > div'); // find every li in the ul selector
                const Pronduct_list_length = await page.$$('ul.co-product-list__main-cntr');
                const Length = await Pronduct_list_length[0].$$('li > div > div > div > h3')
                
                for (let i = 0; i < Length.length; i++ ){
                    const Product_name = await Prondcut_list[i].$eval('h3', h3 => h3.innerText);
                    const Product_price = await Prondcut_list[i].$eval('strong', strong => strong.innerText);
                    const Price_per_item = await Prondcut_list[i].$eval('p', p => p.innerText);
                    const Pack_size = await Prondcut_list[i].$eval('div > span', span => span.innerText)

                    await fs.appendFile(File_path, `"${Product_name}", "${Product_price}", "${Price_per_item}","${Pack_size}"\n`);
                    

                    
                }
                
                if (await page.$('div.co-pagination')) {
                    const page_count = await page.$('div.co-pagination');
                    const page_num = await page_count.$eval('button', button => button.innerText);
                    const first_url = page.url();

                    for (let i = 2; i <= page_num; i++){
                        await page.goto(first_url+'?page='+[i]);

                        await page.waitForSelector('ul.co-product-list__main-cntr');
                        const Prondcut_list = await page.$$('ul.co-product-list__main-cntr > li > div'); // find every li in the ul selector
                        const Pronduct_list_length = await page.$$('ul.co-product-list__main-cntr');
                        const Length = await Pronduct_list_length[0].$$('li > div > div > div > h3')

                        for (let i = 0; i < Length.length; i++ ){
                            const Product_name = await Prondcut_list[i].$eval('h3', h3 => h3.innerText);
                            const Product_price = await Prondcut_list[i].$eval('strong', strong => strong.innerText);
                            const Price_per_item = await Prondcut_list[i].$eval('p', p => p.innerText);
                            const Pack_size = await Prondcut_list[i].$eval('div > span', span => span.innerText)
                            await fs.appendFile(File_path, `"${Product_name}", "${Product_price}", "${Price_per_item}","${Pack_size}"\n`);                   
                        }console.log('\n')
                    }  
                }  
            }
            console.log('done')
        }await browser.close()
              

    } catch(e){
        console.log('error', e)
    }
})();