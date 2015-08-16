/*
* Gabriel Allegretti - 2015
* Cria um arquivo com os horários das cadeiras da UFRGS no formato ICalendar, que então pode
* ser importado em diversos aplicativos de calendário. Ver https://en.wikipedia.org/wiki/List_of_applications_with_iCalendar_support
* Utiliza a versão 2.0 do ICalendar, RFC 5545 http://tools.ietf.org/search/rfc5545
* Configurado para o semestre 2015/2
* Para utilizar, acesse o site da ufrgs e faça login. Então navegue para informações do aluno -> atividades correntes (ou acesse https://www1.ufrgs.br/intranet/portal/public/index.php?cods=1,1,2,9)
* Navegadores testados:
*	-Google Chrome: Sem problemas (ctrl + shift + j)
*	-Firefox:		Sem problemas (ctrl + shift + k), permitir javascript manualmente
* Abra o console para executar javascript e rode esse código. O calendário será salvo pelo seu navegador.
* 	-Calendários testados:
* Google Calendar: 	Problemas na encodificação após importar(palavras com acento não aparecem corretamente)
* Outlook Calendar: Sem problemas
*/

// O nome do arquivo que será gerado
var fileName = "Calendario"

// Assume-se que o inicio do semestre é em uma segunda-feira
// Uma solução mais robusta precisaria de uma biblioteca, como a Datejs
// Datas sobre o semestre, formato aaaammdd
var inicio_semestre = "03/08/2015"
var fim_semestre = "19/12/2015"	
var site_matricula = "https://www1.ufrgs.br/intranet/portal/public/index.php?cods=1,1,2,9"
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

// Adiciona a funcao startsWith() para strings
// http://stackoverflow.com/questions/646628/how-to-check-if-a-string-startswith-another-string
if (typeof String.prototype.startsWith != 'function') {
	 String.prototype.startsWith = function (str){
	return this.indexOf(str) === 0;
  };
}

// Converte dias da semana para abreviação usada pelo iCal
var dicionario_dias = {
"Segunda":"MO",
"Terça":  "TU",
"Quarta": "WE",
"Quinta": "TH",
"Sexta":  "FR",
"Sábado": "SA",
"Domingo":"SU" 
}

// Dado um dia da semana, retorna seu indice
var indice_dias = {
"MO" : 0,
"TU" : 1,
"WE" : 2,
"TH" : 3,
"FR" : 4,	
"SA" : 5,
"SU" : 6
}

//Le o horario da aula de uma string para as variaveis globais. 
//Exemplo:
//LeHorario("Quinta - 08:30-09:20 (2)")
//[0] - "Quinta"    - dia que ocorre
//[1] - "-"			-
//[2] - "08:30-09:20" - horário que ocorre
//[3] - "(2)" 		- quantos períodos dura (50 min cada)
//inicio_aula e fim_aula ficaram no formato 'hhmm'
//dia_aula ficana de acordo com o dicionario_dias
//Retorna true se o horario é valido, falso se não é
function LeHorario(linha)
{
	//Le o dia
	var bits = linha.split(/[\s,]+/)
	dia_aula = dicionario_dias[bits[0]]

	// Le a hora
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

//Le uma data e retorna uma string no formato do iCal
//Ex: LeData("03/08/2015") -> "20150803"
//Se nao for uma data bem definida, retorna undefined
function LeData(linha)
{
	if (typeof linha != "string" || linha.length != 10)
		return undefined
	
	linha = linha.replace('/','')
	linha = linha.replace('/','')
	
	if (linha.length != 8)
		return undefined
	
	var dataIcal = linha.slice(4,9)
	dataIcal += linha.slice(2,4)
	dataIcal += linha.slice(0,2)
	
	return dataIcal
}



function main()
{
	// Cria o evento usando as variaveis globais
	function EscreveEvento()
	{
		Calendario += "BEGIN:VEVENT\n"
		// DTSTART deve ser a primeira vez que o evento ocorre apos o inicio do semestre
		// Se não for sincronizado, é undefined behaviour :( -> http://tools.ietf.org/search/rfc5545#page-167 (A.1 - 1)
		// Uma solução mais robusta precisaria de uma biblioteca, como a Datejs
		// Essa solução não ideal assume que o semestre começa em uma segunda-feira e no inicio do mes (se o dia após a soma nao existir, é undefined behaviour):
		var primeiraAula = Number(inicio_semestre)
		primeiraAula += indice_dias[dia_aula] 
		Calendario += "DTSTART:" + primeiraAula + "T" + inicio_aula + "00\n" + // Inicio da aula
					  "DTEND:" + primeiraAula + "T" + fim_aula + "00\n"	+  	   // Fim da aula
					  "RRULE:FREQ=WEEKLY;BYDAY=" + dia_aula + ";" + "UNTIL=" + fim_semestre + "\n" + // Regra para repetir o evento no dia certo até acabar o semestre	
					  "LOCATION:" + lugar_aula + "\n" + 					   // Onde vai ser a aula
					  "CATEGORIES:Aula\n" +			  						   // Categoria do evento
					  "SUMMARY:" + nome_aula + "\n" +  						   // Nome da disciplina (nome do evento no calendario)
					  "DESCRIPTION:"										   // Descrição do evento
		// Se a disciplina tinha uma Observação
		if (descricao_aula != "") 				
			Calendario += descricao_aula + "; " // Descricao_aula já começa com "Observação:"
		Calendario += "Turma:" + codigo_aula + "; Professor(a):" + prof_aula + "\n" + // Turma e professor
					  "END:VEVENT\n"
	}
		
	// Garante que está no site certo
	if (location.toString() != site_matricula)
	{
		alert("Redirecionando para a página certa")
		window.location.replace(site_matricula)
		return
	}
	
	// Converte as datas
	inicio_semestre = LeData(inicio_semestre)
	fim_semestre = LeData(fim_semestre)

	// Adiciona o header do calendario
	var Calendario = "BEGIN:VCALENDAR\nVERSION:2.0\n"
					 
	// Acessa a tabela dos horários
	var table = document.getElementsByClassName("modelo1")[1]
	if (table === undefined)
	{
		alert("Erro ao ler os horarios")
		return
	}

	// Para cada disciplina (linha 0 é o 'header', então começa na 1)
	for (var i = 1; i < table.rows.length; i++)
	{
		var currentRow = table.rows[i]
		//Colunas/cells:
		//0 : Icone da impressora - irrelevante
		//1 : Nome da disciplina
		//2 : Codigo da turma
		//3 : Horario - local
		//4 : Progessor(es)
		
		// Le o nome da disciplina
		nome_aula = currentRow.cells[1].textContent.trim()
		if (!nome_aula)
			nome_aula = "Não especificado"
			
		// Le a turma
		codigo_aula = currentRow.cells[2].textContent.trim()
		if (!codigo_aula)
			codigo_aula = "Não especificado"
		
		// Le o(s) professor(es) (pode ser mais de um, cada um sendo um child)
		prof_aula = ""
		for (var k = 1; k < currentRow.cells[4].childElementCount; k++)
		{
			if (k > 1)
				prof_aula += "; "
			prof_aula += currentRow.cells[4].children[k].textContent.trim()
		}
		if (!prof_aula)
			prof_aula = "Não especificado"
		
		if (debug == 1)
			var alertString = "Disciplina:" + nome_aula + "\n" + "Turma:" + codigo_aula + "\n\n"
		
		// Algumas disciplinas tem um campo extra: "Observação", que quando existe, é o ultimo elemento na coluna Horario - Local
		// Se existir esse campo, lê ele e decrementa o childrenLen para evitar que ele seja lido como um horario
		var childElementCount = currentRow.cells[3].childElementCount
		var lastChildInnerText = currentRow.cells[3].children[childElementCount - 1].textContent
		if (lastChildInnerText.startsWith("Observação"))
		{
			descricao_aula = lastChildInnerText
			childElementCount--
		}
		// Se nao houver uma descricao, limpa a string
		else
		{
			descricao_aula = ""
		}
		// Para item no bloco de horários
		for (var j = 0; j < childElementCount; j++)
		{
			// Acessa o item j
			var item = currentRow.cells[3].children[j]
				
			// Le horario caso esteja especificado
			if (item.childElementCount > 0)
			{
				var dia_horario = item.childNodes[0].wholeText
			}
			else
			{
				console.log("Aviso: \"" + nome_aula + "\" nao tem horário definido para o dia " + dia_aula)
				continue
			}
			
			// Transforma para o formato válido para o iCal
			var resultado = LeHorario(dia_horario.slice(0, dia_horario.indexOf("&")))
			if (resultado == false)
			{
				console.log("Aviso: \"" + nome_aula + "\" pode não ter tido um horário lido com sucesso")
					continue
			}
			
			//Le local caso esteja especificado
			if (item.childElementCount > 0)
			{
				lugar_aula = item.childNodes[1].textContent.trim()
			}
			else
			{
				lugar_aula = "Não especificado"
			}
			
			// Cria o evento no calendario
			EscreveEvento()
		}

		if (debug == 1)
		{
			alertString += "Dia:" + dia_aula + " - " + "Inicio:" + inicio_aula + " Fim:" + fim_aula + "\n" + "Lugar:" + lugar_aula + "\n\n"	
			alert(alertString)
		}
	}

	Calendario += "END:VCALENDAR\n"

	// Cria o arquivo do calendario
	var file = window.document.createElement('a');
	file.href = window.URL.createObjectURL(new Blob([Calendario], {type: 'text/calendar;charset=UTF-8'}));
	file.download = fileName + ".ics";
	
	// Faz o download do calendario
	document.body.appendChild(file)
	file.click();
	document.body.removeChild(file)
	
}

main()

