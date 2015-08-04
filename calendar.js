/*
* Cria um arquivo com os horários das cadeiras da UFRGS no formato ICalendar, que então pode
* ser importado em diversos calendários. Ver https://en.wikipedia.org/wiki/List_of_applications_with_iCalendar_support
* Utiliza a versão 2.0 do ICalendar
* Para utilizar, acesse o site da ufrgs e entre em serviços, então navegue para Informacoes do Aluno -> Atividades Correntes
* Compatibilidade:
* Google Calendar: 	-Problemas na encodificação (palavras com acento não aparecem corretamente)
* 					-Primeiro dia do semestre contem as disciplinas de todos os dias
* Outlook Calendar: Sem problemas
*/

// O nome do arquivo
var file_name = "Calendario"
// Datas sobre o semestre, formato aaaammdd
var inicio_semestre = "20150803" // 03/08/2015
var fim_semestre = "20151219"	 // 19/12/2015
var debug = 0


// Nome da disciplina
var nome_aula 
// Qual a turma
var codigo_aula
// Descricao da aula
var descricao_aula
// Nome do professor da disciplina
var prof_aula
// Nem sempre ocorre (formato: "Observação: *")
var observacoes_aula
// Onde é a aula
var lugar_aula
// Quais os dias que tem essa aula (usar o dicionario_dias separado com virgulas)
var dia_aula
// O horario de inicio da aula (formato: hhmmss)
var inicio_aula
// O horario do fim da aula (formato: hhmmss)
var fim_aula

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

//Le o horario da aula de uma string para as variaveis globais. Ex:
//LeHorario("Quinta - 8:30-9:20 (2)")
//inicio_aula e fim_aula ficaram no formato 'hhmm'
//dia_aula ficana de acordo com o dicionario_dias
//Retorna true se o horario é valido, falso se não é
function LeHorario(linha)
{
	//Le o dia
	var bits = linha.split(/[\s,]+/)
	dia_aula = dicionario_dias[bits[0]]

	//Le a hora
	//TODO: Adicionar checks
	var horario = bits[2] //Ex: "15:30-17:10"
	horario = horario.replace(':','')
	horario = horario.replace(':','') //Ex: "1530-1710"
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
		return false
	}
	return true
}

//Adiciona o header do calendario
var Calendario = "BEGIN:VCALENDAR\n"
	Calendario += "VERSION:2.0\n"
	
//Cria o evento usando as variaveis globais
function EscreveEvento()
{
	Calendario += "BEGIN:VEVENT\n"
	Calendario += "DTSTART:" + inicio_semestre + "T" + inicio_aula + "00\n"// Inicio da aula
	Calendario += "DTEND:" + inicio_semestre + "T" + fim_aula + "00\n"	   // Fim da aula
	Calendario += "RRULE:FREQ=WEEKLY;BYDAY=" + dia_aula + ";" + "UNTIL=" + fim_semestre + "\n"	 // Quando ocorr a aula		
	Calendario += "LOCATION:" + lugar_aula + "\n"  // Onde vai ser a aula
	Calendario += "CATEGORIES:Aula\n" 			   // Categoria do evento
	Calendario += "SUMMARY:" + nome_aula + "\n"    // Nome da disciplina (nome do evento no calendario)
	Calendario += "DESCRIPTION:"
	if (descricao_aula != "")
		Calendario += "Observações: " + descricao_aula + "; "
	Calendario += "Turma:" + codigo_aula + "; Professor(a):" + prof_aula + "\n" //Sobre a aula
	Calendario += "END:VEVENT\n"
}

//http://stackoverflow.com/questions/646628/how-to-check-if-a-string-startswith-another-string
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.indexOf(str) === 0;
  };
}

//Le a tabela das disciplinas para a memoria
var html = document.getElementsByClassName("modelo1")
var table = html[1]

//Para disciplina
for (var i = 1; i < table.rows.length; i++)
{
	//Colunas/cells:
	//0 : Icone da impressora - irrelevante
	//1 : Nome da disciplina
	//2 : Codigo da turma
	//3 : Horario - local
	//4 : Progessor(es)
	
	//Le o nome da disciplina
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
	
	
	//Algumas disciplinas tem um campo extra: "Observação", que quando existe, é o ultimo elemento na coluna Horario - Local
	//Se existir esse campo, lê ele e decrementa o childrenLen para evitar que ele seja lido como um horario
	var childrenLen = table.rows[i].cells[3].childElementCount
	if (table.rows[i].cells[3].children[childrenLen - 1].innerText.startsWith("Observação"))
	{
		descricao_aula = table.rows[i].cells[3].children[childrenLen].innerText
		childrenLen--
	}
	//Se nao houver uma descricao, limpa a string
	else
	{
		descricao_aula = ""
	}
	//Para item no bloco de horários
	for (var j = 0; j < childrenLen; j++)
	{
		var horario = table.rows[i].cells[3].children[j]
			
		//Le horario caso esteja especificado
		if (horario.childElementCount > 0)
		{
			var dia_horario = horario.childNodes[0].wholeText
		}
		else
		{
			console.log("Aviso: \"" + nome_aula + "\" nao tem horário definido para o dia " + dia_aula)
			continue
		}
		
		var dia_hora = dia_horario.slice(0, dia_horario.indexOf("&"))
		var resultado = LeHorario(dia_hora)
		if (resultado == false)
		{
			console.log("Aviso: \"" + nome_aula + "\" pode não ter tido um horário lido com sucesso")
				continue
		}
		
		//Le local caso esteja especificado
		if (horario.childElementCount > 0)
		{
			lugar_aula = horario.childNodes[1].innerText.trim()
		}
		else
		{
			lugar_aula = "Não especificado"
		}
		EscreveEvento()
	}

	if (debug == 1)
	{
		alertString += "Dia:" + dia_aula + " - " + "Inicio:" + inicio_aula + " Fim:" + fim_aula + "\n" + "Lugar:" + lugar_aula + "\n\n"	
		alert(alertString)
	}
}

Calendario += "END:VCALENDAR\n"

// Faz o download do calendario
var file = window.document.createElement('a');
file.href = window.URL.createObjectURL(new Blob([Calendario], {type: 'text/plain;charset=UTF-8', encoding: 'UTF-8'}));
file.download = file_name + ".ics";

// Append anchor to body.
document.body.appendChild(file)
file.click();

// Remove anchor from body
document.body.removeChild(file)
