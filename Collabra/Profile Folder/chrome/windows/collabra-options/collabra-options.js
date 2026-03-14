var g_collabraOptions;

{
    class CollabraOptionsManager {
        get optionsTreeView() {
            return {
                rowCount : 10000,
                getCellText : function(row,column){
                if (column.id == "title") return "Row "+row;
                    else return "February 18";
                },
                setTree: function(treebox){ this.treebox = treebox; },
                isContainer: function(row){ return false; },
                isSeparator: function(row){ return false; },
                isSorted: function(){ return false; },
                getLevel: function(row){ return 0; },
                getImageSrc: function(row,col){ return null; },
                getRowProperties: function(row,props){},
                getCellProperties: function(row,col,props){},
                getColumnProperties: function(colid,col,props){}
            }
        }

        init() {
            return document.getElementById("optionsTree").view=this.optionsTreeView;
        }
    }

    g_collabraOptions = new CollabraOptionsManager;
    g_collabraOptions.init();
}