// ==UserScript==
// @name         nCore - makeup
// @namespace    https://github.com/Victoare/ncore-makeup
// @version      0.1
// @description  Ncore púder és szájfény
// @author       Victoare
// @match        https://ncore.cc/torrents.php*
// @downloadURL  https://raw.githubusercontent.com/Victoare/ncore-makeup/main/makeup.user.js
// @updateURL    https://raw.githubusercontent.com/Victoare/ncore-makeup/main/makeup.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // overload some styles
    var myStyle = document.createElement('style');
    document.head.appendChild(myStyle);
    var cssMod = myStyle.sheet;

    // table header
    cssMod.insertRule('.box_borito { width: 164px; }');
    cssMod.insertRule('.box_nev    { width: 343px; }');

    // table items
    cssMod.insertRule('.box_borito_img     { width: 182px; border: 1px solid #828282; float: left; margin-top: 1px; min-height: 32px; text-align: center;}');
    cssMod.insertRule('.box_borito_img img { width: 182px; }');
    cssMod.insertRule('.box_nev2           { width: 359px; height: 32px; }');
    cssMod.insertRule('.box_nagy, .box_nagy2 { width: 660px; float: right; }');
    cssMod.insertRule('.box_nagy.imdbinfo, .box_nagy2.imdbinfo { width:701px; padding:6px; }');
    cssMod.insertRule('.torrent_txt, .torrent_txt2      { text-overflow: ellipsis; width: 314px; overflow:hidden;}');
    cssMod.insertRule('.torrent_txt a, .torrent_txt2 a  { text-overflow: ellipsis; }');
    cssMod.insertRule('.box_borito         { width: 164px; }');
    cssMod.insertRule('.box_nev            { width: 255px; }');
    cssMod.insertRule('.box_alap_img       { float: right; }');
    cssMod.insertRule('.box_torrent_all    { width: 900px; }');

    cssMod.insertRule('.torrent_lenyilo, .torrent_lenyilo2 { width: 715px; float: right; }');
    cssMod.insertRule('.torrent_lenyilo_lehetoseg { width: 715px; }');
    cssMod.insertRule('.torrent_lenyilo  .torrent_lenyilo_tartalom  { width: 693px; }');
    cssMod.insertRule('.torrent_lenyilo2 .torrent_lenyilo_tartalom  { width: 693px; }');
    cssMod.insertRule('.hr_stuff                  { width: 693px; }');

    cssMod.insertRule('.torrent_lenyilo_tartalom .banner { zoom: 50%; }');

    // new Table header
    $('.box_alcimek_all').prepend(`
<div class="box_alap">
<table class="alcim">
	<tbody><tr>
	<td><div class="alcim_bal"></div></td>
	<td><div class="box_borito">Borító</div></td>
	<td><div class="alcim_jobb"></div></td>
	</tr>
</tbody></table>
</div>
    `);

    // remove uploader column
    $('.box_alcimek_all .box_alap_utolso').remove();
    $('.box_alcimek_all .box_alap:last').removeClass('box_alap').addClass('box_alap_utolso');
    $('.box_torrent_all .box_feltolto2').remove();

    // Extract torrent infos
    var torrents = [];
    var rowDivs = $('.box_torrent_all>div');
    var getImdbID = function(row){
        var attr = $(row).find('.infolink').attr('href');
        return attr ? attr.match(/\/(tt[0-9]*)/)[1] : '';
    }
    var getCoverImg = function(row){
        var attr = $(rowDivs[i+1]).find('img.infobar_ico').attr('onmouseover');
        return attr ? attr.match(/'([^']*)'/)[1] : '';
    }

    for(var i=0;i<rowDivs.length-3;i+=4){
        torrents.push({
            imdbId    : getImdbID(rowDivs[i+1]),
            coverImg  : getCoverImg(rowDivs[i+1]),
            mainRow   : rowDivs[i+1],
            detailRow : rowDivs[i+3],
        });
    }

    // remove clear div-s and detach info rows
    for(var i=0; i<rowDivs.length; i+=2){
        $(rowDivs[i+0]).remove();
        $(rowDivs[i+1]).detach();
    }

    // Distinct IMDB ids
    var distinct = function(arr){
        var ret = [];
        for(var i=0;i<arr.length;i++)
            if(ret.indexOf(arr[i])==-1) ret.push(arr[i]);
        return ret;
    }
    var idList = distinct(torrents.map(function(t){ return t.imdbId; }));

    //re-populate list
    for(var i=0;i<idList.length;i++){
        var html = [];
        var imdbInfoRow = '';
        var noId = idList[i]=='';
        for(var j=0;j<torrents.length;j++){
            if(torrents[j].imdbId==idList[i]){
                if(html.length==0 || noId){
                    html.push('<div class="box_borito_img">' + (torrents[j].coverImg ? '<img src="' + torrents[j].coverImg + '">' : 'Nincs borító') + '</div>');
                    if(!noId){
                        $(torrents[j].mainRow).find('.torrent_txt').removeClass('torrent_txt').addClass('torrent_txt2');
                        imdbInfoRow = $(torrents[j].mainRow).find('.torrent_txt_also');
                    }
                }
                html.push(torrents[j].mainRow);
                html.push(torrents[j].detailRow);
                if(noId){
                    html.push('<div style="clear:both;"></div>');
                }
            }
        }
        if(!noId){
            $(html).find('.torrent_txt_also').remove(); // remove imdb infos
            if(imdbInfoRow){
                html.push('<div class="box_nagy imdbinfo">' + imdbInfoRow.html() + '</div>');
            }
            html.push('<div style="clear:both;"></div>');
        }
        $('.box_torrent_all').append(html);
    }

    // change order of divs because of float:right
    $('.box_torrent_all .box_torrent').each(function(){
        $(this).prepend($(this).find('>div:last'));
    });

    // rearrange odd/even row styles
    $('.box_torrent_all .box_nagy, .box_torrent_all .box_nagy2').each(function(idx, item){ $(item).toggleClass('box_nagy',idx%2==0).toggleClass('box_nagy2',idx%2==1) });
    $('.box_torrent_all .torrent_lenyilo, .box_torrent_all .torrent_lenyilo2').each(function(idx, item){ $(item).toggleClass('torrent_lenyilo',idx%2==1).toggleClass('torrent_lenyilo2',idx%2==0) });

})();
