
@Grab(group='org.mnode.ical4j', module='ical4j', version='3.0.21')

import net.fortuna.ical4j.model.*
import net.fortuna.ical4j.model.property.DtStamp

if( args.length != 3){
    println "necesito lang, entrada, salida"
    return
}

new File(args[1]).withReader{ r->
    r.readLine()

    def builder = new ContentBuilder()
    def calendar = builder.calendar() {
        prodid '-//Ben Fortuna//iCal4j 1.0//EN'
        version '2.0'
        def line
        while( (line=r.readLine())!= null){
            def fields = line.split('\t')
            def title = fields[4].split('\\.').first()
            vevent {                
                uid String.format('%04d%02d%02d-%s', fields[2] as int, fields[1] as int, fields[0] as int, args[0])
                dtstamp new DtStamp()
                dtstart String.format('%04d%02d%02d', fields[2] as int, fields[1] as int, fields[0] as int), parameters: parameters {
                    value('DATE')
                }
                summary title
                description fields[4]
                action 'DISPLAY'
            }
        }
    }
    new File(args[2]).text = calendar.toString()   
}