<?php
// upload.php

// 1. SILENCE ERRORS (Crucial: Prevents HTML warnings from breaking JSON)
error_reporting(0);
ini_set('display_errors', 0);
header('Content-Type: application/json');

$response = ['success' => false, 'message' => 'Unknown error'];

// 2. CHECK FOR SERVER LIMITS (If post_max_size is exceeded, $_FILES is empty)
if (empty($_FILES) && empty($_POST) && isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 0) {
    $response['message'] = 'File exceeds post_max_size in php.ini. Please increase it to 2.1G.';
    echo json_encode($response);
    exit;
}

// 3. CREATE FOLDER IF MISSING
$targetDir = "Files/";
if (!file_exists($targetDir)) {
    if (!mkdir($targetDir, 0777, true)) {
        $response['message'] = 'Failed to create "Files" folder. Check permissions.';
        echo json_encode($response);
        exit;
    }
}

// 4. HANDLE UPLOAD
if (isset($_FILES['file'])) {
    $file = $_FILES['file'];
    
    if ($file['error'] === UPLOAD_ERR_OK) {
        $fileName = basename($file['name']);
        // Add timestamp to prevent overwriting
        $targetFilePath = $targetDir . time() . '_' . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
            $response['success'] = true;
            $response['filePath'] = $targetFilePath;
            $response['message'] = 'Upload successful!';
        } else {
            $response['message'] = 'Server failed to move the file. Check folder permissions.';
        }
    } else {
        $response['message'] = 'Upload error code: ' . $file['error'];
    }
} else {
    $response['message'] = 'No file received by server.';
}

echo json_encode($response);
?>