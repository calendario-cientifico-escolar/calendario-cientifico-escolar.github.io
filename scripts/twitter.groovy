@Grab(group='org.twitter4j', module='twitter4j-core', version='4.0.6')

import twitter4j.TwitterFactory
import twitter4j.StatusUpdate
import static java.util.Calendar.*

filterLang = args[0]
year = args.length > 1 ? args[1] as int : new Date()[YEAR]
month = args.length > 2 ? args[2] as int : new Date()[MONTH]+1
day = args.length > 3 ? args[3] as int : new Date()[DAY_OF_MONTH]

println "Processing $year/$month/$day"

[
    'es':'#CalendarioCientifico',
    'gal':'#CalendarioCientifico',
    'astu':'#CalendariuCientificu',
    'eus':'#ZientziaEskolaEgutegia',
    'cat':'#CalendariCientífic',
    'arag':'#CalandarioScientifico',
    'en':'#ScientificCalendar',    
].each{ kv ->    
    String lang = kv.key
    String hashtag = kv.value

    if( lang != filterLang ){
        println "skip lang $lang"    
        return
    }

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
	String link = ""
	String hashtags = "${hashtag} "
    hashtags += lang=='es' ? findTags(day,month) : ""

    long inReply = 0
	def tweets = splitText("$title\n$body", "$link\n$hashtags")
    tweets.eachWithIndex{ str, i ->
        String page = tweets.size() == 1 ? "" : "${i+1}/${tweets.size()}"
	StatusUpdate status = new StatusUpdate("$str\n$page").inReplyToStatusId(inReply)	    
        if( i == 0 ){
            def bytes = "https://calendario-cientifico-escolar.github.io/images/personajes/${found[3]}.png".toURL().bytes
            status.media "${found[3]}", new ByteArrayInputStream(bytes)
        }
		inReply = TwitterFactory.singleton.updateStatus(status).id
		println status.status
    }
   
}


def splitText( String text, String suffix ){
	def ret = []
	def words = text.split(' ')
	def current = ''
	words.eachWithIndex{ w, i ->
		if( current.length() > 180 ){
			ret.add current
			current = ''
		}
		current+= "$w "
	}
	current += "\n$suffix"
	ret.add current
	ret
}

def findTags(int day, int month){
    String ret = ""
    try{
    new File("static/data/csv/etiqueta.csv").withReader{ reader ->
        reader.readLine()
        String line
        while( (line=reader.readLine()) != null){
            def fields = line.split(',')
            if( fields.length != 3)
                continue
            if( fields[0] as int == day && fields[1] as int == month){
                ret = "\nCC ${fields[2]}"
                break
            }
        }
    }      
    }catch(e){        
    }
    ret
}


