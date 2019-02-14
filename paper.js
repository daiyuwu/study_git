let paper = null;
let lock = false;

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
        if (lock)
            return;
        this.pageIdx -= 1;
        // this.renderPage();
        this.slidePre();
    }

    next() {
        if (this.pageIdx >= this.pageTotalNum-1)
            return;
        if (lock)
            return;
        this.pageIdx += 1;
        // this.renderPage();
        this.slideNext();
    }

    

    genPageHtml() {
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

        return html;
    }

    genPageElement() {
        let element = document.createElement("div");
        element.setAttribute("class", "paper");

        let page = this.pages[this.pageIdx];
    
        let preBtn = document.createElement("div");
        if (this.pageIdx > 0) {
            preBtn.setAttribute("class", "slide-btn");
            preBtn.setAttribute("onClick", "pre()");
            preBtn.appendChild(new Text("<"));
        } else {
            preBtn.setAttribute("class", "slide-none");
        }
        element.appendChild(preBtn);

        let paperContent = document.createElement("div");
        paperContent.setAttribute("class", "paper-content");
        element.appendChild(paperContent);
        let paperHeadline = document.createElement("h1");
        paperHeadline.setAttribute("class", "paper-headline");
        paperHeadline.append(new Text(page.headLine.content));
        paperContent.appendChild(paperHeadline);
        let paperContentLines = document.createElement("div");
        for (line of page.contentLines) {
            paperContentLines.appendChild(line.genElement());
            paperContentLines.appendChild(document.createElement("br"));
        }
        paperContent.appendChild(paperContentLines);
        let nextBtn = document.createElement("div");
        if (this.pageIdx < this.pageTotalNum-1) {
            nextBtn.setAttribute("class", "slide-btn");
            nextBtn.setAttribute("onClick", "next()");
            nextBtn.appendChild(new Text(">"));
        } else {
            nextBtn.setAttribute("class", "slide-none");
        }
        element.appendChild(nextBtn);

        return element;
    }

    renderPage() {
        let targetTag = document.getElementById("app");
        let pageHtml = this.genPageHtml();
    
        targetTag.innerHTML = pageHtml;
    }

    slidePre() {
        lock = true;

        let targetTag = document.getElementById("app");
        let papers = document.getElementsByClassName("paper");
        let oldPaper = papers[0];
        let newPaper = this.genPageElement();
        newPaper.setAttribute("class", "paper prepend-paper");

        targetTag.setAttribute("style", "width:190vw; left: -100vw");
        
        targetTag.insertBefore(newPaper, oldPaper);
        oldPaper.setAttribute("style", "left:100vw;");

        setTimeout(()=>{
                oldPaper.remove();
                newPaper.setAttribute("style", "left:0;");
                targetTag.setAttribute("style", "width: 95vw;");
                lock = false;
        }, 300);
    }

    slideNext() {
        lock = true;

        let targetTag = document.getElementById("app");
        let papers = document.getElementsByClassName("paper");
        let oldPaper = papers[0];
        let newPaper = this.genPageElement();
        newPaper.setAttribute("class", "paper append-paper");

        targetTag.setAttribute("style", "width: 190vw;");
        oldPaper.setAttribute("style", "left:-100vw;");
        targetTag.appendChild(newPaper);

        setTimeout(()=>{
                oldPaper.remove();
                newPaper.setAttribute("style", "left:0;");
                targetTag.setAttribute("style", "width: 95vw;");
                lock = false;
        }, 300);
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

    genElement() {
        let element = document.createElement("div");
        element.setAttribute("class", "line");
        element.setAttribute("style", `background-color: ${this.layerColor()}`);
        let preSpace = "";
        for (let i=0; i<this.layer; i++)
            preSpace += "　　";
        let textEle = this.genContentElement(preSpace);
        element.appendChild(textEle);
        
        return element;
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

    genContentElement(preSpace) {
        let element = document.createElement("span");

        if (this.content.includes("*$")) {
            element.setAttribute("class", "common-cm");
            element.appendChild(new Text(preSpace + this.content.replace("*$", "$")));
        } else {
            element.appendChild(new Text(preSpace + this.content));
        }
        
        return element;
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