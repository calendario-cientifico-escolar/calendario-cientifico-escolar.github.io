@Grab('io.github.http-builder-ng:http-builder-ng-core:1.0.4')

import static groovyx.net.http.HttpBuilder.configure
import static groovyx.net.http.ContentTypes.JSON
import groovyx.net.http.*
import static java.util.Calendar.*

year = args.length > 0 ? args[0] as int : new Date()[YEAR]
month = args.length > 1 ? args[1] as int : new Date()[MONTH]+1
day = args.length > 2 ? args[2] as int : new Date()[DAY_OF_MONTH]

println "Processing $year/$month/$day"

TELEGRAM_CHANNEL=System.getenv("TELEGRAM_CHANNEL")
TELEGRAM_TOKEN=System.getenv("TELEGRAM_TOKEN")

if( !TELEGRAM_CHANNEL || !TELEGRAM_TOKEN ){
    println "Necesito la configuracion de telegram"
    return
}

http = configure{
    request.uri = "https://api.telegram.org"
    request.contentType = JSON[0]
}

html = ""

['es','gal','astu','eus','cat','arag','en'].each{ lang ->
    
    String[]found

    new File("static/data/csv/${year}_${lang}.tsv").withReader{ reader ->
        reader.readLine()
        String line
        while( (line=reader.readLine()) != null){
            def fields = line.split('\t')
            if( fields.length != 5)
                continue
            if( fields[0] as int == day && fields[1] as int == month && fields[2] as int == year){
                found = fields
                break
            }
        }
    }

    if(!found){
        println "not found $year/$month/$day"
        return
    }

    String title=  found[4].split('\\.').first()
	String body=  found[4].split('\\.').drop(1).join(' ')

    if( !html ){
        html = "<a href='https://calendario-cientifico-escolar.github.io/images/personajes/${found[3]}.png'> </a>"
    }

    html +="""
<b>$title</b>
$body
"""
}

html += """
<i>Proyecto FECYT FTC 2019 15288</i>
<a href="http://www.igm.ule-csic.es/calendario-cientifico">Puedes descargar el calendario y la guía didáctica en nuestra web</a>
"""

http.post{
    request.uri.path = "/bot$TELEGRAM_TOKEN/sendMessage"
    request.body = [
        chat_id: TELEGRAM_CHANNEL,
        text: html,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
    ]
}
