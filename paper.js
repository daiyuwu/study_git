let paper = null;

let pre = function() {
    paper.pre();
}

let next = function() {
    paper.next();
}

let processBindkey = function(e) {
    switch (e.keyCode) {
        case 37:
            pre();
            break;
        case 39:
            next();
            break;
    }
}

let bindKeyboard = function() {
    document.onkeydown = processBindkey;
}

let init = function() {
    fetch('http://localhost:5500/paper.txt')
        .then(rs => rs.text())
        .then(rsText => {
            parseAndRender(rsText);
        });
    
    bindKeyboard();
}

let parseAndRender = function(text) {
    let pureLines = text.split("\n");
    
    let lines = [];
    for (l of pureLines) {
        let line = new Line(l.trim(), (l.match(/\t/g) || []).length);
        lines.push(line);
    }

    let papers = trans2PaperPages(lines);
    paper = new Paper(papers, 0);
    paper.renderPage();
};

let trans2PaperPages = function(lines) {
    let pages = [];
    let headLine = null;
    let contentLines = [];
    for (line of lines) {
        if (line.layer === 0 && line.content.startsWith("# "))
            headLine = line;
        else
            contentLines.push(line);
        if (line.content === '') {
            pages.push(new PaperPage(headLine, contentLines));
            headLine = null;
            contentLines = [];
        }
    }

    return pages;
}

let renderLines = function(lines) {
    let targetTag = document.getElementById("app");
    let html = "";
    for (l of lines)
        html += l.genHtml();
    targetTag.innerHTML = html;
}

class Paper {
    constructor(pages, pageIdx) {
        this.pages = pages;
        this.pageIdx = pageIdx;
        this.pageTotalNum = pages.length;
    }

    pre() {
        if (this.pageIdx <= 0)
            return;
        this.pageIdx -= 1;
        this.renderPage();
    }

    next() {
        if (this.pageIdx >= this.pageTotalNum-1)
            return;
        this.pageIdx += 1;
        this.renderPage();
    }

    renderPage() {
        let targetTag = document.getElementById("app");
        let html = "";
        let page = this.pages[this.pageIdx];
    
        html += "<div class='paper'>";
        if (this.pageIdx > 0)
            html += "<div class='slide-btn' onClick='pre()'><</div>";
        else
            html += "<div class='slide-none'></div>";
        html += "<div class='paper-content'>";
        html += `<h1 class='paper-headline'>${page.headLine.content}</h1>`;
        html += "<div>";
        for (line of page.contentLines) {
            html += line.genHtml();
        }
        html += "</div>";
        html += "</div>";
        if (this.pageIdx < this.pageTotalNum-1)
            html += "<div class='slide-btn' onClick='next()'>></div>";
        else
            html += "<div class='slide-none'></div>";
        html += "</div>";
    
        targetTag.innerHTML = html;
    }
}

class PaperPage {
    constructor(headLine, contentLines) {
        this.headLine = headLine;
        this.contentLines = contentLines;
    }
}

class Line {
    constructor(content, layer) {
        this.content = content;
        this.layer = layer;
    }

    genHtml() {
        let html = `<div class="line" style="background-color: ${this.layerColor()}">`;
        for (let i=0; i<this.layer; i++)
            html += "　　";
        html += this.renderContent();
        html += "</div>";
        html += "<br />";

        return html;
    }

    renderContent() {
        let html = "";			

        if (this.content.includes("*$")) {
            html += `<span class="common-cm">`;
            html += this.content.replace("*$", "$");
        } else {
            html += `<span>`;
            html += this.content;
        }
        
        html += "</span>";
        
        return html;
    }

    layerColor() {
        switch(this.layer) {
            case 4:
                return "#fafdff";
            case 3:
                return "#edefec";
            case 2:
                return "#d6d6d4";
            case 1:
                return "#c3bfb4";
            case 0:
                return "#9e9393";
        }
    }
}

init();