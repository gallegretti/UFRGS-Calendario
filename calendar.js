/*
* Cria um arquivo com os horários das cadeiras da UFRGS no formato ICalendar, que então pode
* ser importado em diversos calendários. Ver https://en.wikipedia.org/wiki/List_of_applications_with_iCalendar_support
* Utiliza a versão 2.0 do ICalendar
* Informacoes do Aluno -> Atividades Correntes
*/

// O nome do arquivo
var file_name = "Calendario"
// Datas sobre o semestre, formato aaaammdd
var inicio_semestre = "20150803" // 03/08/2015
var fim_semestre = "20151219"	 // 19/12/2015
var debug = 1

//TODO: Se em uma disciplina ha aulas em dias diferentes, mas nos mesmos horarios e lugares,
//junta em apenas um evento

// Informacoes de uma disciplina

// 		Uma vez
// Nome da disciplina
var nome_aula 
// Qual a turma
var codigo_aula
// Nome do professor da disciplina
var prof_aula
// Nem sempre ocorre (formato: "Observação: *")
var observacoes_aula

//		Uma vez ou mais
// Onde é a aula
var lugar_aula
// Quais os dias que tem essa aula (usar o dicionario_dias separado com virgulas)
var dia_aula
// O horario de inicio da aula (formato: Thhmmss)
var inicio_aula = ""
// O horario do fim da aula (formato: Thhmmss)
var fim_aula = ""


// Caso para teste de informacoes de uma disciplina
/*
nome_aula = "arq"
lugar_aula = "Vale, sala xxx"
codigo_aula = "B"
prof_aula = "Girafales"
dias_aula = ["MO","WE"]
inicio_aula = "T120000"
fim_aula = "T130000"	
*/

//Converte dias da semana para abreviação usada pelo iCal
var dicionario_dias = {
"Segunda":"MO",
"Terça":  "TU",
"Quarta": "WE",
"Quinta": "TH",
"Sexta":  "FR",
"Sábado": "SA",
"Domingo":"SU" 
}

//Le o horario da aula de uma string. Ex:
//LeHorario("Quinta - 8:30-9:20 (2)")
function LeHorario(linha)
{
	//Le o dia
	var bits = linha.split(/[\s,]+/)
	dia_aula = dicionario_dias[bits[0]]
	
	//Le a hora
	var horario = bits[2] //Ex: "15:30-17:10"
	horario = horario.replace(':','')
	horario = horario.replace(':','')
	inicio_aula = horario.slice(0, horario.indexOf("-"))
	fim_aula = horario.slice(horario.indexOf("-") + 1)
	
	// Normaliza os horarios (caso nao tenham um zero no inicio Ex: 8:30 (nunca ocorre?))
	if (inicio_aula.length == 3)
	{
		inicio_aula = "0" + inicio_aula
	}
	
	if (fim_aula.length == 3)
	{
		fim_aula = "0" + fim_aula
	}
	
	if ((inicio_aula.length != 4) || (fim_aula.length != 4))
	{
		alert("Erro ao ler o horario da aula:\n Inicio:" + inicio_aula + "Fim:" + fim_aula + "\n")
		return
	}
	
	//alert(dia_aula + "\n" + inicio_aula + " - " + fim_aula)

}

//Le a tabela para a memoria
var html = document.getElementsByClassName("modelo1")
var table = html[1]

//fuck html
function RemoveNBSP(string)
{
	string = string.slice(string.indexOf(";") + 1)
	string = string.slice(0,string.indexOf("&"))
	return string
}


//Colunas:
//0 : Icone da impressora - irrelevante
//1 : Nome da disciplina
//2 : Codigo da turma
//3 : Horario - local
//4 : Progessor(es)
//Para cada linha (pula primeira linha pois nao é uma disciplina)
//var dias = []
//var horarios = []
for (var i = 1; i <= table.rows.length; i++)
{
	//Le o nome da aula
	nome_aula = table.rows[i].cells[1].innerText.trim()
	if (!nome_aula)
		nome_aula = "Não especificado"
		
	//Le a turma
	codigo_aula = table.rows[i].cells[2].innerText.trim()
	if (!codigo_aula)
		codigo_aula = "Não especificado"
	
	//Le o(s) professor(es) (pode ser mais de um, mas sao uma unica string com \n após cada prof)
	prof_aula = table.rows[i].cells[4].innerText.trim()
	if (!prof_aula)
		prof_aula = "Não especificado"
	
	
	if (debug == 1)
		var alertString = "Disciplina:" + nome_aula + "\n" + "Turma:" + codigo_aula + "\n\n"
	
	//Para cada dia da semana que tem aula
	for (var j = 0; j < table.rows[i].cells[3].children.length; j++)
	{
		var horario = table.rows[i].cells[3].children[j]
		
		//Para comparar com outros iguais
		var horario_e_local = horario.innerText
		
		//Le horario caso esteja especificado
		if (horario.childElementCount > 0)
			var dia_horario = horario.childNodes[0].wholeText
		//TODO: Handle else
		
		var novo = dia_horario.slice(0, dia_horario.indexOf("&"))
		//alert(novo)
		LeHorario(novo)
		
		//Le local caso esteja especificado
		if (horario.childElementCount > 0)
			lugar_aula = horario.childNodes[1].innerText.trim()
		else
			lugar_aula = "Não especificado. Pode ser a mesma sala de outro horario"
		
		if (debug == 1)
			alertString += "Dia:" + dia_aula + " - " + "Inicio:" + inicio_aula + " Fim:" + fim_aula + "\n" + "Lugar:" + lugar_aula + "\n\n"
		
		//Se o local for igual a algum outro, adiciona o dia junto
	}
	alert(alertString)
			
	//Escreve a disciplina no calendario
	
}



/*

var Calendario = "BEGIN:VCALENDAR\n"
	Calendario += "VERSION:2.0\n"
// Para cada disciplina
	//for...
	{
		Calendario += "BEGIN:VEVENT\n"
		Calendario += "DTSTART:" + inicio_semestre + inicio_aula + "\n"// Inicio da aula
		Calendario += "DTEND:" + inicio_semestre + fim_aula + "\n"	 // Fim da aula
		Calendario += "RRULE:FREQ=MONTHLY;BYDAY="		 					 // Quando ocorre as aulas
		// Para cada dia que tem aula
		for (index = 0; index < dias_aula.length; index++)
		{
			if (index > 0)
				Calendario += ","
			Calendario += dias_aula[index]
		}
		Calendario += ";UNTIL=" + fim_semestre + "\n"  // Ate o fim do semestre			
		Calendario += "LOCATION:" + lugar_aula + "\n"  // Onde vai ser a aula
		Calendario += "CATEGORIES:Aula\n" 			   // Categoria do evento
		Calendario += "SUMMARY:" + nome_aula + "\n"    // Nome da disciplina (nome do evento no calendario)
		Calendario += "DESCRIPTION:Turma:" + codigo_aula + ", Professor(a):" + prof_aula + "\n" //Sobre a aula
		Calendario += "END:VEVENT\n"
	}
Calendario += "END:VCALENDAR\n"


// Faz o download do calendario
var file = window.document.createElement('a');
file.href = window.URL.createObjectURL(new Blob([Calendario], {type: 'text/ics'}));
file.download = file_name + ".ics";

// Append anchor to body.
document.body.appendChild(file)
file.click();

// Remove anchor from body
document.body.removeChild(file)
*/