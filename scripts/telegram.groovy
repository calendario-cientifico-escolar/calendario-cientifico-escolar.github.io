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

html = ''

['es','astu','cat','eus','gal','en'].each{ lang ->
    
    String[]found

    new File("docs/csv/${year}_${lang}.tsv").withReader{ reader ->
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

    if( !html ){
        html = """@CalCientifico        
        <a href="https://jagedn.github.io/calendario-cientifico/images/celebridades/${found[3]}.png"> </a>
        """
    }

    html +="""${found[4]}
    -------
    """
}

html += """
<i>Proyecto FECYT FTC-2019-15288</i>
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
