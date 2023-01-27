<?php

    if(isset($_GET['url'])){
        //$url = $_GET['url'];
        //$url = '';
        //$keys = array_keys($_GET);
        //foreach($keys as $key){
        //    if ($key == 'url') {
        //        $url .= $_GET[$key];
        //    } else {
        //        $url .= '&'.$key.'='.$_GET[$key];
        //    }
        //}
        $url = explode('?url=', $_SERVER['REQUEST_URI'])[1];
        $url = str_replace('|*|&', '?', $url);
        $url = str_replace('|*|', '', $url);
        //$url = ltrim($url, '&');
    }else if(isset($_POST['url'])){
        //header("Content-Type: image/png");
        $url = $_POST['url'];
    }

    if(isset($url)){
        //$url = str_replace('|*|&', '?', $url);
        //$url = str_replace('|*|', '', $url);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_HEADER, TRUE);
        curl_setopt($ch, CURLOPT_USERAGENT,'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36');
        curl_setopt($ch, CURLOPT_AUTOREFERER, TRUE);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
        curl_setopt($ch, CURLOPT_VERBOSE, TRUE);
        curl_setopt($ch, CURLOPT_ENCODING , "");

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

        /*
            foreach ($headerArray as $header) {
                $colonPos = strpos($header, ':');
                if ($colonPos !== FALSE)
                    if ($colonPos !== FALSE)
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
                            } else if (trim($headerName) == 'Set-Cookie') {
                                $header = '';
                            }
                        }
                        header($header, FALSE);
                    header($header, FALSE);
                header($header, FALSE);
            }
        */
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

                //if (str_starts_with(trim($headerName), 'X-')) continue;
                if(substr(trim($headerName), 0, 2) == 'X-') continue;
                if (trim($headerName) == 'Set-Cookie' && isset($_GET['setCookie']))
                {
                    $header = preg_replace("/domain.*;/", "domain=".$_SERVER['HTTP_HOST']."; SameSite=None; secure; ", $header);
                } else if (trim($headerName) == 'Set-Cookie') {
                    $header = '';
                }
            }
            header($header, FALSE);
        }
        header("Access-Control-Allow-Origin: *");
        //header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");

        echo $body;

        curl_close($ch);
    } else {
        echo null;
    }

?>