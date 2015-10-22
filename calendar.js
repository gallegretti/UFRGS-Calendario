// ==UserScript==
// @name         UFRGS Calendar
// @version      1.0
// @description  Generate a file with current activities that the student is attending in UFRGS that can be imported in many calendar apps.
// @author       Gabriel Allegretti
// @source		 https://github.com/gallegretti/UFRGS-Calendario
// @include      https://www1.ufrgs.br/intranet/portal/public/index.php?cods=1,1,2,9
// @grant        none
// ==/UserScript==

// Script is intended be used with Tampermonkey, but copy-pasting the code into the javascript console in your browser and then excecuting will work
// Script best visualized with Notepad++
// Calendar format: ICalendar 2.0 , RFC 5545 http://tools.ietf.org/search/rfc5545
// TODO: Test in browsers other than google chrome
// TODO: Move code to class?
// TODO: Use consistent naming for variables and functions

//Variáveis customizaveis
var inicio_semestre = "03/08/2015", // (dd/mm/aaaa)
	fim_semestre = "19/12/2015", // (dd/mm/aaaa)
	com_semana_academica = true, // Se deve adicionar o evento da semana acadêmica ao calendario
	inicio_semana_academica = "19/10/2015", // Data do inicio da semana acadêmica
	// Se o último dia do evento é 23/10/2015, deve-se usar o dia seguinte desse
	fim_semana_academica = "24/10/2015",    // Data do fim da semana acadêmica

// Variáveis internas globais
	nome_aula, 
	codigo_aula,
	descricao_aula,
	prof_aula,
	observacoes_aula,
	lugar_aula,
	dia_aula, // (usar o dicionario_dias, separado com virgulas cada ocorrência)
	inicio_aula, // (formato: hhmmss)
	fim_aula; // (formato: hhmmss)
	
// Adiciona o header do calendario
	var Calendario = "BEGIN:VCALENDAR\nVERSION:2.0\n"
	
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

// Cria um evento no calendario com a semana academica
function EventoSemanaAcademica()
{
	var inicio_evento = LeData(inicio_semana_academica)
	var fim_evento = LeData(fim_semana_academica)
	if ((inicio_evento === undefined) || (fim_evento === undefined))
	{
		alert("Não foi possivel criar o evento da semana acadêmica pois as datas são inválidas")
		return
	}
	Calendario += "BEGIN:VEVENT\n" + 
				  "DTSTART;VALUE=DATE:" + inicio_evento + "\n" +
				  "DTEND;VALUE=DATE:" + fim_evento + "\n" +
				  "SUMMARY:Semana Acadêmica\n" +
				  "END:VEVENT\n"
}

//Le o horario da aula de uma string para as variaveis globais. Ex: LeHorario("Quinta - 08:30-09:20 (2)")
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
// dd/mm/aaaa -> aaaammdd
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

//Cria o calendário e faz seu download pelo browser
function generateCalendar()
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
		// Se a disciplina tinha uma Observação explícita, vai para a descrição
		if (descricao_aula != "") 				
			Calendario += descricao_aula + "; " // Descricao_aula já começa com "Observação:"
		Calendario += "Turma:" + codigo_aula + "; Professor(a):" + prof_aula + "\n" + // Turma e professor
					  "END:VEVENT\n"
	}
		
	// Converte as datas
	inicio_semestre = LeData(inicio_semestre)
	fim_semestre = LeData(fim_semestre)
	
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
		//4 : Professor(es)
		
		// Le o nome da disciplina
		nome_aula = currentRow.cells[1].textContent.trim()
		if (!nome_aula)
			nome_aula = "Não especificado"
			
		// Le a turma
		codigo_aula = currentRow.cells[2].textContent.trim()
		if (!codigo_aula)
			codigo_aula = "Não especificado"
		
		prof_aula = ""
		// Para cada professor (pode ser mais de um, cada um sendo um child)
		for (var k = 1; k < currentRow.cells[4].childElementCount; k++)
		{
			if (k > 1)
				prof_aula += "; "
			prof_aula += currentRow.cells[4].children[k].textContent.trim()
		}
		if (!prof_aula)
			prof_aula = "Não especificado"
		
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
	}
	
	if (com_semana_academica)
		EventoSemanaAcademica()

	Calendario += "END:VCALENDAR\n"

	// Cria o arquivo do calendario
	var file = window.document.createElement('a');
	file.href = window.URL.createObjectURL(new Blob([Calendario], {type: 'text/calendar;charset=UTF-8'}));
	file.download = "calendar.ics";
	
	// Faz o download do calendario
	document.body.appendChild(file)
	file.click();
	document.body.removeChild(file)
	
}

// Cria um botão na página, que ao ser clicado, faz o downlaod do calendário
function addButton()
{
	// O botão será inserido dentro de um 'div' e de um 'form', igual ao botão 'Imprimir'
	var principal = document.createElement("div")
	principal.className = "bt_calendario"
	var form = document.createElement("form")
	principal.appendChild(form)
	
	// Cria o botão de gerar o calendário
	var button = document.createElement("input")
	form.appendChild(button)
	button.className = "button"
	button.type = "button"
	button.id = "botaoCalendario"
	button.onclick = generateCalendar
	button.value = "Gerar calendario"
	
	// O botão de 'Imprimir' usa posição absoluta, então usa tambem para ficar do lado dele
	button.style.position = "absolute"
	button.style.right =  "150px"
	button.style.top = "145px"
	
	// Insere antes do botão 'Imprimir'
	var element = document.getElementById("conteudo")
	element.insertBefore(principal,element.firstChild)
}
addButton()
