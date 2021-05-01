require('dotenv').config()
const readline = require('readline');
const fs = require('fs');
const Twitter = require('twit');
const { parse } = require('dotenv');

const T = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});


sendTweet = async function(text, inReply, file, altText){
    let mediaIdStr=[]
    if( file ){
        const b64content = fs.readFileSync(file, { encoding: 'base64' });
        const respmedia = await T.post('media/upload', { media_data: b64content });    
        mediaIdStr.push(respmedia.data.media_id_string);
        if( altText ){
            const meta_params = { 
                media_id: respmedia.data.media_id_string, 
                alt_text: { 
                    text: altText 
                } 
            }; 
            await T.post('media/metadata/create', meta_params);    
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
        input: fs.createReadStream(`static/data/csv/etiqueta.csv`),
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
    if (fs.existsSync(`static/data/csv/${year}/alttext.csv`)==false){
        return null;
    }
    const rl = readline.createInterface({
        input: fs.createReadStream(`static/data/csv/${year}/alttext.csv`),
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

doIt = async function(args){
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
    const altText = await findAltText(year, month, day);

    const title=  fields[4].split('\\.')[0];
    const body=  fields[4].split('\\.').slice(1).join(' ');

    const hashtags = staticHashtags[lang] + (lang=='es' ? `\n${hashtag} ` : '')
    const tweets = splitText(`${title}\n${body}`, `${hashtags}`)
    
    let inReply = 0;
    for(var t in tweets){
        const p = parseInt(t)+1
        const page = tweets.length == 1 ? '' : `${p}/${tweets.length}`;
        const str = tweets[t];
        const media = t == 0 ? `static/images/personajes/${fields[3]}.png` : null;
        inReply = await sendTweet( `${str}\n${page}`, inReply, media, altText)        
    }        
}

doIt(process.argv)