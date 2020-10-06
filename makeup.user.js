// ==UserScript==
// @name         nCore - makeup
// @namespace    https://github.com/Victoare/ncore-makeup
// @version      0.4.1
// @description  Ncore púder és szájfény
// @author       Victoare
// @match        https://ncore.cc/torrents.php*
// @downloadURL  https://raw.githubusercontent.com/Victoare/ncore-makeup/main/makeup.user.js
// @updateURL    https://raw.githubusercontent.com/Victoare/ncore-makeup/main/makeup.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ===========================================================================================
    // CSS overload
    // ===========================================================================================

    // extract theme from stylesheet path     <link rel="stylesheet" href="https://static.ncore.cc/styles/default2/style_sslv11.css" type="text/css">
    var theme = $('link[rel="stylesheet"][href^="https://static.ncore.cc/styles/"]').attr('href').match(/\/styles\/([^\/]*)\/style_/)[1];
    $('body').addClass('theme_' + theme);

    // overload some styles
    var myStyle = document.createElement('style');
    document.head.appendChild(myStyle);
    var cssMod = myStyle.sheet;

    cssMod.insertRule('.ajaxGetOtherVersions { cursor: pointer; float: right; border: 1px solid #838383; padding: 2px; background-color: #3c869a; font-weight: bold; }');

    // table header
    cssMod.insertRule('.box_borito { width: 164px; }');
    cssMod.insertRule('.box_nev    { width: 343px; }');

    // table items
    cssMod.insertRule('.box_borito_img     { width: 182px; border: 1px solid #828282; float: left; margin-top: 1px; min-height: 32px; text-align: center;}');
    cssMod.insertRule('.box_borito_img img { width: 182px; }');
    cssMod.insertRule('.box_nev2           { width: 359px; height: 32px; }');
    cssMod.insertRule('.box_nagy, .box_nagy2 { width: 660px; float: right; }');
    cssMod.insertRule('.box_nagy.imdbinfo, .box_nagy2.imdbinfo { width:701px; padding:6px; height:auto; }');
    cssMod.insertRule('.torrent_txt, .torrent_txt2      { text-overflow: ellipsis; width: 294px; overflow:hidden;}'); //314px for single icon, 294 for double
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

    // theme specific overrides
    //cssMod.insertRule('.theme_brutecore .banner { zoom: 500%; }');

    // ===========================================================================================
    // Modify table header, Add cover, remove uploader column
    // ===========================================================================================

    $('.box_alcimek_all').prepend(`
      <div class="box_alap">
        <table class="alcim"><tbody><tr>
          <td><div class="alcim_bal"></div></td>
          <td><div class="box_borito">Borító</div></td>
          <td><div class="alcim_jobb"></div></td>
        </tr></tbody></table>
      </div>
    `);

    $('.box_alcimek_all .box_alap_utolso').remove();
    $('.box_alcimek_all .box_alap:last').removeClass('box_alap').addClass('box_alap_utolso');
    $('.box_torrent_all .box_feltolto2').remove();

    // ===========================================================================================
    // Extract torrent info, detach originals from GUI
    // ===========================================================================================

    var torrents = [];
    $('.box_torrent_all>div[style="clear:both;"]').remove();
    var $rowDivs = $('.box_torrent_all>div');

    var getImdbID = function($row){
        var attr = $row.find('.infolink').attr('href');
        return attr ? attr.match(/\/(tt[0-9]*)/)[1] : '';
    }
    var getCoverImg = function($row){
        var attr = $row.find('img.infobar_ico').attr('onmouseover');
        return attr ? attr.match(/'([^']*)'/)[1] : '';
    }
    var getTorrentId = function($row){
        var attr = $row.find('a[onclick^="torrent("]').attr('onclick');
        return attr ? attr.match(/\((\d*)\)/)[1] : '';
    }

    for(var i=0;i<$rowDivs.length-1;i+=2){
        var $mainRow = $($rowDivs[i]);
        torrents.push({
            imdbId    : getImdbID($mainRow),
            torrentId : getTorrentId($mainRow),
            coverImg  : getCoverImg($mainRow),
            $mainRow  : $mainRow,      // .box_torrent
            detailRow : $rowDivs[i+1], // .torrent_lenyilo v. .torrent_lenyilo2
        });
    }

    $rowDivs.detach();

    // ===========================================================================================
    // Rebuild table using IMDB ID if available
    // ===========================================================================================

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
        var $siterank = null;
        var noId = idList[i]=='';
        var firstTorrentData = null;
        for(var j=0;j<torrents.length;j++){
            if(torrents[j].imdbId==idList[i]){
                var $mainRow = torrents[j].$mainRow;
                if(html.length==0 || noId){
                    html.push('<div class="box_borito_img">' + (torrents[j].coverImg ? '<img src="' + torrents[j].coverImg + '">' : '') + '</div>');
                }
                if(firstTorrentData==null) firstTorrentData = torrents[j];
                if(!$siterank) $siterank = $mainRow.find('.siterank');
                if(torrents[j].coverImg) $mainRow.find('.infobar').remove();
                if(!noId) $mainRow.find('.siterank').remove();

                if(!$mainRow.find('.torrent_txt_also').html()){
                    $mainRow.find('.torrent_txt_also').remove();
                    $mainRow.find('.torrent_txt').removeClass('torrent_txt').addClass('torrent_txt2');
                }

                html.push($mainRow);
                html.push(torrents[j].detailRow);

                if(noId){
                    html.push('<div style="clear:both;"></div>');
                }
            }
        }
        if(!noId){
            if($siterank){
                var $infoBar = $('<div class="box_nagy imdbinfo">');
                $infoBar.append($siterank);
                $infoBar.append($('<div class="ajaxGetOtherVersions">Más verziók keresése</div>').click(
                    (function(ftd, $ib){return function(){ GetDetails(ftd, $ib);}})(firstTorrentData, $infoBar)
                ));
                html.push($infoBar);
                //html.push('<div class="box_nagy imdbinfo">' + $siterank.html() + '<div class="ajaxGetOtherVersions" data-ftidx="' + firstTorrentIdx + '">Más verziók lekérdezése</div></div>');
            }
            html.push('<div style="clear:both;"></div>');
        }
        $('.box_torrent_all').append(html);
    }

    $('.box_torrent_all .ajaxGetOtherVersions').each(function(idx,itm){  });
    $(html).find('.ajaxGetOtherVersions').click((function(ftd){return function(){GetDetails(ftd);}})(firstTorrentData));

    // change order of divs because of float:right
    $('.box_torrent_all .box_torrent').each(function(){
        $(this).prepend($(this).find('>div:last'));
    });

    reArrangeOddEvenClasses();

    // ===========================================================================================
    // Functions to call
    // ===========================================================================================

    // rearrange odd/even row styles
    function reArrangeOddEvenClasses(){
      $('.box_torrent_all .box_nagy, .box_torrent_all .box_nagy2').each(function(idx, item){ $(item).toggleClass('box_nagy',idx%2==0).toggleClass('box_nagy2',idx%2==1) });
      $('.box_torrent_all .torrent_lenyilo, .box_torrent_all .torrent_lenyilo2').each(function(idx, item){ $(item).toggleClass('torrent_lenyilo',idx%2==1).toggleClass('torrent_lenyilo2',idx%2==0) });
    }

    function GetDetails(torrentData, $infoBar){
        var id = torrentData.imdbId.substr(2); // remove "tt" from the id
        var torrentsOnScreen = distinct($('.box_torrent_all a[href^="torrents.php?action=details&id="]').map(function(){return $(this).attr('href').match(/id=(\d+)/)[1]}));
        $.get("ajax.php?action=other_versions&id="+id+"&fid="+torrentData.torrentId+"&details=1",function(data){
            var $data = $(data);
            var html = $data.find('.box_torrent_mini2').map(function(){
                var $itm = $(this);
                var torrentID = $itm.find('a[href^="torrents.php?action=details&id="]').attr('href').match(/id=(\d+)/)[1];
                if(torrentsOnScreen.indexOf(torrentID)>-1) return '';
                var title = $itm.find('.box_txt_ownfree a').attr('title');
                return `
<div class="box_torrent">
  <div class="box_nagy2">
    <div class="box_nev2">
	  <div class="tabla_szoveg">
	    <div style="cursor:pointer" onclick="konyvjelzo('${torrentID}');" class="torrent_konyvjelzo2"></div>
	    <div class="torrent_txt2">
          <a href="torrents.php?action=details&amp;id=${torrentID}" onclick="torrent(${torrentID}); return false;" title="${title}"><nobr>${title}</nobr></a>
	    </div>
	  </div>
    </div>
    <div class="users_box_sepa"></div>
	<div class="box_feltoltve2">${$itm.find('.box_feltoltve_other_short').html()}</div>
	<div class="users_box_sepa"></div>
	<div class="box_meret2">${$itm.find('.box_meret2').html()}</div>
	<div class="users_box_sepa"></div>
	<div class="box_d2">${$itm.find('.box_d2').html()}</div>
	<div class="users_box_sepa"></div>
	<div class="box_s2">${$itm.find('.box_s2').html()}</div>
	<div class="users_box_sepa"></div>
	<div class="box_l2">${$itm.find('.box_l2').html()}</div>
    <div class="users_box_sepa"></div>
  </div>
  <div class="box_alap_img">
	${$itm.find('.box_alap_img').html()}
  </div>
</div>
<div class="torrent_lenyilo" style="display:none;" id="${torrentID}"></div>`;
            });
            $(html.get().join('')).insertBefore($infoBar);
            $infoBar.find('.ajaxGetOtherVersions').remove();
            reArrangeOddEvenClasses();
        });
    }
})();
