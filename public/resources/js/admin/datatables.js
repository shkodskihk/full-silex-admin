(function($) {

    'use strict';

    var fixedHeader;
    $(function(){

        // dataTable
//        console.log("add bind changed");
        $(document).bind('changed', function() {
//            console.log("document changed");
            if($(".aTable").length > 0) {
//                console.log("aTable found");

                $(".aTable").not('.initialized').each(function(index, argTable) {
//                    console.log("init table");
                    var table           = $(argTable);
                    var isSortable      = table.hasClass("sortableTable");
                    var isServerSide    = table.hasClass("serverSide");

                    var columnDefs      = [];
                    if (typeof(_columnDefs) != 'undefined' && _columnDefs != null) {
                        columnDefs      = _columnDefs;
                    }

                    var sorting         = [];
                    table.find('th').each(function (index, el) {
                        // Get sorting classes in table's th elements:
                        // If class contains 'sort_asc', sort ascending.
                        // If class contains 'sort_desc', sort descending.
                        if ($(el).hasClass('sort_asc')) {
                            sorting[sorting.length] = [index, 'asc'];
                        }
                        else if ($(el).hasClass('sort_desc')) {
                            sorting[sorting.length] = [index, 'desc'];
                        }

                    });

                    var length = _numDisplayedRows;
                    //				var classes_r = table.attr('class');
                    //				if (classes_r != null) {
                    //					var classes = classes_r.split(' ');
                    //					for (var i = 0; i < classes.length; i++) {
                    //						var matches = /^rows\_(.+)/.exec(classes[i]);
                    //						if (matches != null) {
                    //							length = parseInt(matches[1].replace('rows_', ''));
                    //						}
                    //					}
                    //				}

                    // todo: Make searching better. Maybe make the whole data interaction ajax so we can search data from server.
                    table.addClass('initialized');

                    if (isServerSide) {
                        $._oTable = table.DataTable({
                            "sDom": "rt<'row'<'col-sm-12'p i>>",
                            "sPaginationType": "bootstrap",
                            "oLanguage": {
                                "sLengthMenu": "_MENU_"
                            },
                            "searching": true,
                            "processing": true,
                            "serverSide": true,
                            "ajax": {
                                "url": table.attr('rel'),
                                "data": function ( d ) {
                                }
                            },
                            "columnDefs": _columnDefs,
                            "drawCallback": function (settings) {
                                $(document).trigger("changed");
                            },
                            "rowCallback": function (nRow, aData, index) {
                                $(nRow).attr('data-id', aData.DT_RowAttr["data-id"]);
                                if (isSortable) {
                                    $(nRow).attr('data-position', aData.DT_RowAttr["data-position"]);
                                }
                            }
                        });


                        if (isSortable) {
                            table.find("tbody").sortable({
                                start: function (event, ui) {
                                    ui.item.oldId = ui.item.attr('data-id')
                                    ui.item.startPos = ui.item.index();
                                    ui.item.oldPos = ui.item.attr('data-position');
                                },
                                stop: function (event, ui) {
                                    $.ajax({
                                        type: "POST",
                                        url: _reorderUrl,
                                        data: {
                                            oldPosition: ui.item.oldPos,
                                            newPosition: table.DataTable().row(ui.item.index()).nodes().to$().attr('data-position'),
                                            id: ui.item.oldId
                                        }
                                    });
                                    $._oTable.ajax.reload(null, false);
                                    //$('#datatable-media').DataTable().draw(false);
                                }
                            });
                            table.find("tbody").disableSelection();
                        }
                    }
                    else {
                        $._oTable = table.DataTable({
                            "sDom": "rt<'row'<'col-sm-12'p i>>",
                            "sPaginationType": "bootstrap",
                            "oLanguage": {
                                "sLengthMenu": "_MENU_"
                            },
                            'searching': true,
                            "processing": true,
                            "serverSide": table.hasClass("serverSide"),
                            "ajax": table.attr('rel'),
                            "columnDefs": _columnDefs,
                            "drawCallback": function (settings) {
                                $(document).trigger("changed");
                            },
                            "rowCallback": function (nRow, aData, index) {
                                if (isSortable) {
                                    // Add styling on each td:
                                    // Get hidden columns, then iterate each column, if column is hidden, move to next index
                                    var columns = this.dataTableSettings[0].aoColumns;

                                    var i = 0;
                                    for (var i2 = 0; i2 < columns.length; i2++) {
                                        var column = columns[i2];
                                        if (column.bVisible) {
                                            var td = $('td', nRow).slice(i, (i + 1));
                                            if (typeof aData[i2] == 'object' && aData[i2] != null) {
                                                if (typeof aData[i2].style != 'undefined') {
                                                    td.attr('style', aData[i2].style);
                                                }
                                                if (typeof aData[i2].class != 'undefined') {
                                                    td.removeClass(aData[i2].class);
                                                    td.addClass(aData[i2].class);
                                                }
                                                td.html('');
                                                if (typeof aData[i2].data != 'undefined') {
                                                    td.html(aData[i2].data);
                                                }
                                            }
                                            i++;
                                        }
                                    }

                                    /* set tr id. */
                                    var id = aData[_sortableColumnIndex];
                                    $(nRow).attr("id", id);
                                }
                                return nRow;
                            }
                        });

                        if(isSortable){
                            table.rowReordering({
                                sURL: _reorderUrl,
                                iIndexColumn: 0,
                                sRequestType: "POST"
                            });
                        }

//                    fixedHeader = new $.fn.dataTable.FixedHeader( $._oTable, {
//                        "offsetTop" : $("body.fixed-header .header").outerHeight()
//                    } );
                    }

                    if(sorting.length > 0) {
                        table.sort(sorting);
                    }

                    if($('#search-table').length > 0){
                        $("#search-table").keyup(function(){
                            var val = $(this).val();
                            $._oTable
                                .search( val )
                                .draw();
                        });
                    }

                    if($("#dataTable_length").length > 0){
                        $("#dataTable_length").change(function(){
                            $._oTable.page
                                .len( $(this).val() )
                                .draw();
                        });
                    }
                });

                $(document).on("change", ".dataTables_wrapper .dataTables_length select", function(){
                    var val = $(this).val();
                    $.ajax({
                        url : _config.baseUrl + 'admin/home/updateNumDisplayedRows',
                        type : 'POST',
                        data : { numRows : val}
                    });
                });
            }
        });

    });

})(window.jQuery);