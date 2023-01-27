<!DOCTYPE html>
<html>
<?php

    $url_id = 0;
    $url_token = 0;
    $locale = 'default';
    $dir = null;

    if (isset($_GET['id'])) {
        $url_id = $_GET['id'];
    }
    if (isset($_GET['token'])) {
        $url_token = $_GET['token'];
    }
    if (isset($_GET['locale'])) {
        $locale = $_GET['locale'];
    }

    if (is_dir("elements/" . $locale)) {
        $dir = "elements/" . $locale;
    }

    if ($dir) {
        # load head element for web
        include($dir . "/head.html");

        # load html header element
        include($dir . "/header.html");
    }

?>

<body>
    <main>
        <?php

            include("app/index.html");

        ?>
    </main>
</body>

<script>
    var url_id = '<?php echo $url_id ?>';
    var url_token = '<?php echo $url_token ?>';
</script>

<!-- load scripts -->
<script src="app/resources/js/cfg.js"></script>
<script src="app/resources/js/i18n.js"></script>
<script src="app/resources/js/CustomModal.js"></script>
<script src="app/resources/js/ErrorHandler.js"></script>
<script src="app/resources/js/LocalStorageHandler.js"></script>

<script src="app/resources/definitions/basemaps.js"></script>
<script src="app/resources/js/BasemapHandler.js"></script>

<script src="app/resources/js/RequestHandler.js"></script>
<script src="app/resources/js/MapHandler.js"></script>
<script src="app/resources/js/LayerHandler.js"></script>
<script src="app/resources/js/ToponymHandler.js"></script>
<script src="app/resources/js/PlayerHandler.js"></script>
<script src="app/resources/js/main.js"></script>

<!-- load styles -->
<link rel="stylesheet" href="app/resources/css/CustomPlayer.css" />
<link rel="stylesheet" href="app/resources/css/styles.css" />
<link rel="stylesheet" href="app/resources/css/CustomModal.css" />
<link rel="stylesheet" href="app/resources/css/responsive.css" />

<?php

    if ($dir) {
        # load html footer element
        include($dir . "/prefooter.html");
        include($dir . "/footer.html");
    }

?>

</html>