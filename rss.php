<?php
header('Content-Type: application/xml; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo file_get_contents(
    'https://feeds.ivoox.com/feed_fg_f13188549_filtro_1.xml'
);
?>
