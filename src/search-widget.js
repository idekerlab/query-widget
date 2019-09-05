(function() {
  
  
  const template = document.createElement("template");
  template.innerHTML = `
    <style>
      :host {
        display: flex;
        flex-wrap: wrap;
      }
      ::slotted(search-widget-panel) {
        flex-basis: 100%;
      }
    </style>
    <slot name="tab"></slot>
    <slot name="panel"></slot>
  `;


  /**
   * Wrapper
   */
  class CyQueryWidget extends HTMLElement {
    constructor() {
      super();
      this.innerHTML = `
        <div id="query-widget-container">
          <search-widget>
            <search-widget-tab role="heading" slot="tab">
              Gene List
            </search-widget-tab>
            <search-widget-panel role="region" slot="panel">
              <gene-list-query />
            </search-widget-panel>
            
            <search-widget-tab role="heading" slot="tab">
              Keywords
            </search-widget-tab>
            <search-widget-panel role="region" slot="panel">
              <keyword-query />
            </search-widget-panel>
          </search-widget>

          <icon-bar />
        </div>
      `
      
      const container = this.querySelector('#query-widget-container')
      container.style.width = '100%'
      container.style.flexDirection = 'column'
      container.style.display = 'flex'
      container.style.background = '#FFFFFF'
    }

   connectedCallback() {

   } 


  }
  customElements.define("cy-query-widget", CyQueryWidget);

  class IconBar extends HTMLElement {
    constructor() {
      super()
      this.innerHTML = `
        <div class="icon-bar">
          <p>NDEx Network Query</p>
          <img class="logo-icon" src="http://search-dev.ndexbio.org/static/media/ndex-logo-mono-dark.e913eb27.svg"></img>
          <img class="logo-icon" src="http://search-dev.ndexbio.org/static/media/cytoscape-logo-mono-dark.72d0e13b.svg"></img>
          <img class="logo-icon" src="http://search-dev.ndexbio.org/static/media/nrnb-logo-mono-dark.5a41574a.svg" /></img>
          <img class="logo-icon" src="http://search-dev.ndexbio.org/static/media/wp-logo-mono-dark.1183f75b.svg" /></img>
        </div>
      `
      const iconBar = this.querySelector('.icon-bar')
      iconBar.style.height = '3em'
      iconBar.style.width = 'inherit'
      iconBar.style.display = 'flex'
      iconBar.style.alignItems = 'center'
      iconBar.style.justifyContent = 'space-around'
      iconBar.style.background = '#F5F5F5'
    
      const logoIcons = this.querySelectorAll('.logo-icon')
      console.log('ICONS', logoIcons)
      logoIcons.forEach(icon => {
        icon.style.height = '1.5em'
      })
      // logoIcons.style.height = '1.5em'

    }
  }
  customElements.define("icon-bar", IconBar);

  class SearchWidget extends HTMLElement {
    constructor() {
      super();

      this._onSlotChange = this._onSlotChange.bind(this);
      this.attachShadow({ mode: "open" });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
      this._tabSlot = this.shadowRoot.querySelector("slot[name=tab]");
      this._panelSlot = this.shadowRoot.querySelector("slot[name=panel]");
      this._tabSlot.addEventListener("slotchange", this._onSlotChange);
      this._panelSlot.addEventListener("slotchange", this._onSlotChange);
    }

    connectedCallback() {
      this.addEventListener("click", this._onClick);

      if (!this.hasAttribute("role")) this.setAttribute("role", "tablist");

      Promise.all([
        customElements.whenDefined("search-widget-tab"),
        customElements.whenDefined("search-widget-panel")
      ]).then(_ => this._linkPanels());
    }

    disconnectedCallback() {
      this.removeEventListener("keydown", this._onKeyDown);
      this.removeEventListener("click", this._onClick);
    }

    _onSlotChange() {
      this._linkPanels();
    }

    _linkPanels() {
      const tabs = this._allTabs();
      tabs.forEach(tab => {
        const panel = tab.nextElementSibling;
        if (panel.tagName.toLowerCase() !== "search-widget-panel") {
          console.error(
            `Tab #${tab.id} is not a` + `sibling of a <search-widget-panel>`
          );
          return;
        }

        tab.setAttribute("aria-controls", panel.id);
        panel.setAttribute("aria-labelledby", tab.id);
      });

      const selectedTab = tabs.find(tab => tab.selected) || tabs[0];

      this._selectTab(selectedTab);
    }

    _allPanels() {
      return Array.from(this.querySelectorAll("search-widget-panel"));
    }

    _allTabs() {
      return Array.from(this.querySelectorAll("search-widget-tab"));
    }

    _panelForTab(tab) {
      const panelId = tab.getAttribute("aria-controls");
      return this.querySelector(`#${panelId}`);
    }

    _prevTab() {
      const tabs = this._allTabs();
      let newIdx = tabs.findIndex(tab => tab.selected) - 1;
      return tabs[(newIdx + tabs.length) % tabs.length];
    }

    _firstTab() {
      const tabs = this._allTabs();
      return tabs[0];
    }

    _lastTab() {
      const tabs = this._allTabs();
      return tabs[tabs.length - 1];
    }

    _nextTab() {
      const tabs = this._allTabs();
      let newIdx = tabs.findIndex(tab => tab.selected) + 1;
      return tabs[newIdx % tabs.length];
    }

    reset() {
      const tabs = this._allTabs();
      const panels = this._allPanels();

      tabs.forEach(tab => (tab.selected = false));
      panels.forEach(panel => (panel.hidden = true));
    }

    _selectTab(newTab) {
      // Deselect all tabs and hide all panels.
      this.reset();

      // Get the panel that the `newTab` is associated with.
      const newPanel = this._panelForTab(newTab);
      // If that panel doesn’t exist, abort.
      if (!newPanel) throw new Error(`No panel with id ${newPanelId}`);
      newTab.selected = true;
      newPanel.hidden = false;
      newTab.focus();
    }

    _onClick(event) {
      if (event.target.getAttribute("role") !== "tab") return;
      this._selectTab(event.target);
    }
  }
  customElements.define("search-widget", SearchWidget);

  let howtoTabCounter = 0;

  class SearchWidgetTab extends HTMLElement {
    static get observedAttributes() {
      return ["selected"];
    }

    constructor() {
      super();
    }

    connectedCallback() {
      // If this is executed, JavaScript is working and the element
      // changes its role to `tab`.
      this.setAttribute("role", "tab");
      if (!this.id) this.id = `search-widget-tab-generated-${howtoTabCounter++}`;

      // Set a well-defined initial state.
      this.setAttribute("aria-selected", "false");
      this.setAttribute("tabindex", -1);
      this._upgradeProperty("selected");
    }

    _upgradeProperty(prop) {
      if (this.hasOwnProperty(prop)) {
        let value = this[prop];
        delete this[prop];
        this[prop] = value;
      }
    }

    attributeChangedCallback() {
      const value = this.hasAttribute("selected");
      this.setAttribute("aria-selected", value);
      this.setAttribute("tabindex", value ? 0 : -1);
    }

    set selected(value) {
      value = Boolean(value);
      if (value) this.setAttribute("selected", "");
      else this.removeAttribute("selected");
    }

    get selected() {
      return this.hasAttribute("selected");
    }
  }
  customElements.define("search-widget-tab", SearchWidgetTab);

  // Number of panels in the widget
  let searchWidgetPanelCounter = 0;
  
  class SearchWidgetPanel extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.setAttribute("role", "tabpanel");
      if (!this.id) this.id = `search-widget-panel-generated-${searchWidgetPanelCounter++}`;
    }
  }
  customElements.define("search-widget-panel", SearchWidgetPanel);


  const BASE_URL = 'http://search.ndexbio.org/?genes='

  class GeneListQuery extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.innerHTML = `
        <div class="gene-list-panel">
          
          <textarea id="gene-text" rows="5" class="gene-list" placeholder="Enter gene list..."></textarea>
          <div class="button-panel">
            <button id="info-button" class="button">?</button>
            <button id="run-button" class="button">Run</button>
          </div>
        </div>`
      
        const gl = this.querySelector('.gene-list')
        gl.style.height = '100%'
        gl.style.border = 'none'
        gl.style.width = '90%'
        gl.style.padding = '0'
        gl.style.resize = 'none'
        
        const geneListPanel = this.querySelector('.gene-list-panel')
        geneListPanel.style.display = 'flex'
        geneListPanel.style.alignItems = 'center'
        geneListPanel.style.justifyContent = 'center'
        geneListPanel.style.background = 'red'
        geneListPanel.style.height = '100%'
        
        const buttonPanel = this.querySelector('.button-panel')
        buttonPanel.style.height = '100%'
        buttonPanel.style.width = '10%'
        buttonPanel.style.background = '#F5F5F5'
        buttonPanel.style.display = 'flex'
        buttonPanel.style.alignItems = 'center'
        buttonPanel.style.justifyContent = 'space-around'
        buttonPanel.style.flexDirection = 'column'
        
        const runButton = this.querySelector('#run-button')
        runButton.style.background = 'orange'
        runButton.style.width = '4em'

        runButton.addEventListener('click', () => this._onClick(gl.value))
        const infoButton = this.querySelector('#info-button')
        infoButton.style.background = '#26c6da'
        infoButton.style.width = '4em'
        infoButton.addEventListener('click', () => this._onClick(gl.value))

    }

    _onClick(text) {
      console.log('Start Search: ', text)

      if(text !== undefined && text !== null && text.length !== 0) {
        const parts = text.split(/[\n, \t]/)
        const genes = parts.filter(val => val !== '')
        const url = BASE_URL + genes.join(',')
        window.open(url, '_blank')
      }
    }
  }
  
  customElements.define("gene-list-query", GeneListQuery);


  // const NDEX_URL = 'http://www.ndexbio.org/#/search?searchType=All&searchString=brca1&searchTermExpansion=false'
  const NDEX_URL = 'http://www.ndexbio.org/#/search?searchType=All&searchTermExpansion=false&searchString='
  class KeywordQuery extends HTMLElement {
    constructor() {
      super();
      
      this.innerHTML = `
        <div class="keyword-panel">
          <div class="button-panel">
            <button id="browse-button" class="button keyword-button">Browse</button>
            <button id="featured-button" class="button keyword-button">Featured Networks</button>
            <button id="sample-button" class="button keyword-button">Search Examples</button>
            <drop-down-list></drop-down-list>
          </div>
          
          <div class="query-box">
            <input id="keyword-text" placeholder="Enter gene list..."></input>
            <button id="run-keyword-button" class="button">Run</button>
          </div>
        </div>`
      
        const keywordPanel = this.querySelector('.keyword-panel')
        keywordPanel.style.display = 'flex'
        keywordPanel.style.height = '100%'
        keywordPanel.style.width = '100%'
        keywordPanel.style.flexDirection = 'row'
        
        const query = this.querySelector('.query-box')
        query.style.display = 'flex'
        query.style.height = '100%'
        query.style.width = '80%'
        query.style.width = '80%'
        query.style.alignItems = 'center'
        query.style.justifyContent = 'center'

        const keywordText = this.querySelector('#keyword-text')
        keywordText.style.border = 'none'
        keywordText.style.width = '100%'
        keywordText.style.height = '3em'
        keywordText.style.padding = '0'
        keywordText.style.resize = 'none'
        
        
        const buttonPanel = this.querySelector('.button-panel')
        buttonPanel.style.height = '100%'
        buttonPanel.style.width = '20%'
        buttonPanel.style.background = '#F5F5F5'
        buttonPanel.style.display = 'flex'
        buttonPanel.style.alignItems = 'center'
        buttonPanel.style.justifyContent = 'space-around'
        buttonPanel.style.flexDirection = 'column'
        
        const keywordButtons = this.querySelectorAll('.keyword-button')

        keywordButtons.forEach(button => {
          button.style.background = '#286090'
          button.style.fontSize = '0.7em'
          button.style.width = '12em'
          button.style.height = '3em'
        })
        
        const runButton = this.querySelector('#run-keyword-button')
        runButton.style.background = 'orange'
        runButton.style.height = '2.5em'
        runButton.addEventListener('click', () => this._onClick(keywordText.value, 'run'))
        
        const browseButton = this.querySelector('#browse-button')
        browseButton.addEventListener('click', () => this._onClick(keywordText.value, 'browse'))
    }

    _onClick(text, command) {
      console.log('keyword Search: ', text)
      let url = NDEX_URL
      if(command === 'browse') {
        url = url + '*'
        window.open(url, '_blank')
        return
      }

      if(text !== undefined && text !== null && text.length !== 0) {

        if(command === 'run') {
          url = NDEX_URL + text

        }
      } else {
        return        
      }
      
      window.open(url, '_blank')

    }

  }
  
  customElements.define("keyword-query", KeywordQuery);

  class DropDownList extends HTMLElement {
    constructor() {
      super();
      const shadow = this.attachShadow({ mode: 'open' });
      const listContainer = document.createElement('div');
      
      const listItems = this.items;
      listContainer.classList.add('drop-list');
      shadow.appendChild(listContainer);
    }


  }
  
  customElements.define("drop-down-list", DropDownList);


})();