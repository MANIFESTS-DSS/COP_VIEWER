<?php

    ////setlocale(LC_CTYPE, 'es_ES');
    ////ini_set('default_charset', 'utf-8');
    ////header('Content-Type: text/html; charset=utf-8');
    //
    //$data = null;
    //$from = null;
    //$to = null;

    //if (isset($_POST["data"])) {
    //    $data = $_POST["data"];
    //}
    //if (isset($_POST["from"])) {
    //    $from = $_POST["from"];
    //}
    //if (isset($_POST["to"])) {
    //    $to = $_POST["to"];
    //}

    //$encoded = null;

    //if (!empty($data) && !empty($from) && !empty($to)) {
    //    //$encoded = mb_convert_encoding($data, $from, $to);
    //    //$encoded = iconv($from, $to, $data);
    //    $encoded = utf8_encode($data);
    //}

    //echo $encoded;

    header("Access-Control-Allow-Origin: *");    
    header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");

    //$url = $_GET['url'];
    $url = $_POST['url'];
    //$url = explode('url=', $_SERVER['REQUEST_URI'])[1];
    $url = str_replace('|*|&', '?', $url);
    $url = str_replace('|*|', '', $url);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HEADER, TRUE);
    curl_setopt($ch, CURLOPT_USERAGENT,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36');
    curl_setopt($ch, CURLOPT_AUTOREFERER, TRUE);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
    curl_setopt($ch, CURLOPT_VERBOSE, TRUE);

    $headers = getallheaders();

    $extraHeaders = array();

    $extraHeaders['Referer'] = $_SERVER['HTTP_HOST'];
    $extraHeaders['Origin'] = $_SERVER['HTTP_HOST'];

    curl_setopt($ch, CURLOPT_HTTPHEADER, $extraHeaders);

    $response = curl_exec($ch);

    $header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = substr($response, 0, $header_size);
    $body = substr($response, $header_size);

    $headerArray = explode(PHP_EOL, $headers);

    foreach($headerArray as $header)
    {
        $colonPos = strpos($header, ':');
        if ($colonPos !== FALSE) 
        {
            $headerName = substr($header, 0, $colonPos);

            if (trim($headerName) == 'Content-Encoding') continue;
            if (trim($headerName) == 'Content-Length') continue;
            if (trim($headerName) == 'Transfer-Encoding') continue;
            if (trim($headerName) == 'Location') continue;

            if (trim($headerName) == 'Set-Cookie' && isset($_GET['setCookie']))
            {
                $header = preg_replace("/domain.*;/", "domain=".$_SERVER['HTTP_HOST']."; SameSite=None; secure; ", $header);
            }else if (trim($headerName) == 'Set-Cookie'){
                $header = '';
            }
        }
        header($header, FALSE);
    }

    $rexp = '/(?<=encoding=")(.*?)(?=")/';
    //http://develop/plancamgal/encoder.php?url=http://www.intecmar.gal/wms/AM/wms?REQUEST=GetFeatureInfo&SERVICE=WMS&VERSION=1.1.1&LAYERS=%20AM%3AAtlasLimpieza&QUERY_LAYERS=%20AM%3AAtlasLimpieza&FEATURE_COUNT=20&FORMAT=image%2Fpng&INFO_FORMAT=application%2Fvnd.ogc.gml&SRS=EPSG%3A3857&WIDTH=1&HEIGHT=1&X=0&Y=0&BBOX=-948444.2357674956%2C5346049.101113089%2C-837124.744974222%2C5500090.819994456
    if(preg_match($rexp, $body, $match)){
        if(strcmp(strtolower($match[1]), 'utf-8') === 0){
            echo $body;
        }else{
            echo utf8_encode($body);
        }
    }else{
        echo $body;
    }

    //echo utf8_encode($body);
    //echo $body;

    curl_close($ch);

?>