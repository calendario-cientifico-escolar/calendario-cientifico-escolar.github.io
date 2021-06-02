require('dotenv').config()
const readline = require('readline');
const fs = require('fs');
const Twitter = require('twit');
const { parse } = require('dotenv');
const fetch = require('node-fetch');

const T = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

async function downloadFile(source, destination) {
    const response = await fetch(source);
    const buffer = await response.buffer();
    fs.writeFileSync(destination, buffer);
}


sendTweet = async function(text, inReply, file, altText){
    let mediaIdStr=[]
    if( file ){
        console.log(`reading ${file}`)
        const b64content = fs.readFileSync(file, { encoding: 'base64' });
        let respmedia;
        for(let i=0; i<3;i++){
            try{
                respmedia = await T.post('media/upload', { media_data: b64content });   
                break;
            }catch(e){
                console.log(e);
            }
            await sleep(2000);
        }
        mediaIdStr.push(respmedia.data.media_id_string);
        if( altText ){
            const meta_params = { 
                media_id: respmedia.data.media_id_string, 
                alt_text: { 
                    text: altText 
                } 
            }; 
            const media = await T.post('media/metadata/create', meta_params);    
            console.log({media})
        }
    }
    const params = { 
        status: text, 
        media_ids: mediaIdStr,
        in_reply_to_status_id:inReply 
    };
    const post = await T.post('statuses/update', params);
    return post.data.id_str;
}

findTags = async function(year,month, day){
    const rl = readline.createInterface({
        input: fs.createReadStream(`static/data/csv/${year}_etiqueta.csv`),
        console: false
    });
    let tags="";
    for await (const line of rl) {
        const fields = line.split(',');
        if( fields.length == 3){
            if( parseInt(fields[0]) == day && parseInt(fields[1]) == month){
                tags = fields[2];
                break;
            }        
        }
    }    
    return tags;
}

findAltText = async function(year,month, day){
    let tags="No tenemos disponible una descripción de esta imagen pero estamos trabajando en ello";
    if (fs.existsSync(`static/data/csv/${year}_alttext.csv`)){
        const rl = readline.createInterface({
            input: fs.createReadStream(`static/data/csv/${year}_alttext.csv`),
            console: false
        });
        for await (const line of rl) {
            const fields = line.split(';');
            if( fields.length == 3){
                if( parseInt(fields[0]) == day && parseInt(fields[1]) == month){
                    tags = fields[2];
                    break;
                }        
            }
        }    
    }
    return tags;
}

findLine = async function(lang, year, month, day){
    let found = null;
    const rl = readline.createInterface({
        input: fs.createReadStream(`static/data/csv/${year}_${lang}.tsv`),
        console: false
    });    
    for await (const line of rl){
        let fields = line.split('\t');
        if( fields.length == 5){
            if( parseInt(fields[0]) == day && parseInt(fields[1]) == month && parseInt(fields[2]) == year){
                found = fields;
                break;
            }
        }        
    }
    return found
}

splitText = function( text, suffix ){
	let ret = [];
	const words = text.split(' ')
	let current = ''
    for(let i in words){
        const w = words[i];
        if( current.length > 180){
            ret.push(current);
            current = '';
        }
        current+=`${w} `;
    }
    current+=`\n${suffix}`
    ret.push(current);
    return ret;
}

async function doIt(args){
    lang = args[2] || 'es';
    year = args.length > 3 ? args[3] : new Date().getUTCFullYear();
    month = args.length > 4 ? args[4] : new Date().getMonth()+1;
    day = args.length > 5 ? args[5] : new Date().getDate();

    staticHashtags = {
        'es':'#CalendarioCientifico',
        'gal':'#CalendarioCientifico',
        'astu':'#CalendariuCientificu',
        'eus':'#ZientziaEskolaEgutegia',
        'cat':'#CalendariCientífic',
        'arag':'#CalandarioScientifico',
        'en':'#ScientificCalendar',    
    };

    const fields = await findLine(lang, year, month, day);
    const hashtag = await findTags(year, month, day);
    const altText = lang === "es" ? findAltText(year, month, day) : null;
    const title=  fields[4].split('\\.')[0];
    const body=  fields[4].split('\\.').slice(1).join(' ');

    const hashtags = staticHashtags[lang] + (lang=='es' ? `\n${hashtag} ` : '')
    const tweets = splitText(`${title}\n${body}`, `${hashtags}`)
    
    let inReply = 0;
    //const source = `https://calendario-cientifico-escolar.github.io/images/personajes/${fields[3]}.png`
    //const destination = `${fields[3]}.png`
    //const file = await downloadFile(source,destination)
    //console.log(file)
    for(var t in tweets){
        const p = parseInt(t)+1
        const page = tweets.length == 1 ? '' : `${p}/${tweets.length}`;
        const str = tweets[t];
        const media = t == 0 ? `static/images/personajes/${fields[3]}.png` : null;        
        inReply = await sendTweet( `${str}\n${page}`, inReply, media, altText)        
    }
    return true;        
}

(async () => {
    try {
        console.log(process.argv)
        var result = await doIt(process.argv);
        console.log(result);
    } catch (e) {
        console.log(e);
    }
})();