# PowerShell script to upload files to Hostinger via FTP
param(
    [string]$FtpServer = "147.93.99.194",
    [string]$Username = "u467221599",
    [string]$Password = "An87!jVc2X!$Eka",
    [string]$LocalPath = ".\dist\*",
    [string]$RemotePath = "/"
)

# Create FTP request
$ftpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FtpServer$RemotePath")
$ftpRequest.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
$ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
$ftpRequest.UsePassive = $true

try {
    # Create directory if it doesn't exist
    $response = $ftpRequest.GetResponse()
    Write-Host "Directory created/verified successfully"
} catch {
    Write-Host "Directory already exists or error occurred: $($_.Exception.Message)"
}

# Upload files
$files = Get-ChildItem -Path $LocalPath -Recurse -File
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring((Get-Location).Path.Length + 1)
    $remoteFilePath = $RemotePath + "/" + $relativePath.Replace("\", "/")
    
    Write-Host "Uploading: $relativePath to $remoteFilePath"
    
    $ftpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FtpServer$remoteFilePath")
    $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
    $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $ftpRequest.UsePassive = $true
    
    $fileStream = $file.OpenRead()
    $ftpStream = $ftpRequest.GetRequestStream()
    
    $buffer = New-Object byte[] 8192
    $bytesRead = 0
    
    do {
        $bytesRead = $fileStream.Read($buffer, 0, $buffer.Length)
        $ftpStream.Write($buffer, 0, $bytesRead)
    } while ($bytesRead -gt 0)
    
    $ftpStream.Close()
    $fileStream.Close()
    
    Write-Host "Uploaded: $relativePath"
}

Write-Host "Upload completed successfully!"
Write-Host "Your website should be available at: http://intaj-starstechnology.com"
