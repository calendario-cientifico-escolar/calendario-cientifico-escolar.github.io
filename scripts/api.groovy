import groovy.json.JsonOutput;

if( args.length != 2){
    println "necesito entrada, salida"
    return
}

[
    'es',
    'gal',
    'astu',
    'eus',
    'cat',
    'arag',
    'en',
].each{ lang ->
    root = new File("${args[1]}/${lang}/$year/$month")
    root.mkdirs()
    new File("${args[0]}_${lang}.tsv").withReader{ r->
        r.readLine()
        def line
        while( (line=r.readLine())!= null){
            def fields = line.split('\t')
            def title = fields[4].split('\\.').first()
            def body = fields[4].split('\\.').drop(1).join('.')
            def year = fields[2] as int
            def month = fields[1] as int
            def day = fields[0] as int     

            def file = new File(root,"${day}.json")
            file.parentFile.mkdirs()
            file.text = JsonOutput.prettyPrint(JsonOutput.toJson([
                lang:lang,
                year:year,
                month:month,
                day:day,
                title:title,
                body:body,
		image:"https://calendario-cientifico-escolar.github.io/images/personajes/${args[3]}.png"
            ]))
        }
    }    
}
