/**
 * Comandos que existen en un Linux real (Debian/Ubuntu actuales con paquetes comunes).
 * Si el jugador escribe uno que no simulamos, aparece el globo de pensamiento en vez de "command not found".
 */
export const COMANDOS_LINUX = new Set(
  `
alias apt apt-get apt-cache aptitude ar arch awk base32 base64 basename bash bc bg bunzip2 busybox bzcat bzip2
cal cargo cat cc chattr chgrp chmod chown chroot chsh cksum clear cmp column comm cp cpio crontab csplit curl cut
date dd df diff diff3 dig dir dircolors dirname dmesg dnf docker dpkg du echo ed egrep emacs env ethtool ex expand
export expr factor false fdisk fgrep file find finger fmt fold free fsck ftp fuser g++ gawk gcc gdb git gpg grep
groupadd groupdel groups gunzip gzip halt head help hexdump history host hostname hostnamectl htop iconv id
ifdown ifup info init insmod install ionice iostat ip ip6tables iptables iw java jobs join journalctl jq
kill killall last lastlog ld ldd less link ln locale locate logger login logname logout look losetup ls lsattr lsblk
lscpu lsmod lsof lspci lsusb lynx make man md5sum mkdir mkfifo mkfs mknod mktemp modprobe more mount mtr mv mysql
nano nc ncat netcat nft nice nl nmap nmcli node nohup npm nproc nslookup od openssl passwd paste patch perl
pgrep php pidof ping ping6 pip pip3 pkill pr printenv printf ps psql pstree pwd python python3 readlink realpath
reboot renice reset resize2fs rev rm rmdir rsync ruby runuser scp screen script sed seq service setfacl sftp
sh sha1sum sha224sum sha256sum sha384sum sha512sum shred shuf shutdown sleep sort source split sqlite3 ss ssh
ssh-add ssh-agent ssh-copy-id ssh-keygen stat strace strings stty su sudo sum swapoff swapon sync sysctl systemctl
tac tail tar tcpdump tee telnet test time timedatectl timeout tmux top touch tr traceroute tracepath true truncate
tsort tty type ufw ulimit umask umount unalias uname uncompress unexpand uniq unlink unset unzip uptime useradd
userdel usermod users vi vim vmstat w wait wall watch wc wget whatis whereis which who whoami xargs xxd yes yum
zcat zip zsh
`
    .split(/\s+/)
    .filter(Boolean),
);

/** Comandos de Windows/DOS que un novato suele intentar, con su equivalente en Linux. */
export const COMANDOS_WINDOWS: Record<string, string> = {
  dir: "ls",
  cls: "clear",
  type: "cat",
  ipconfig: "ip a",
  copy: "cp",
  move: "mv",
  del: "rm",
  md: "mkdir",
  rd: "rmdir",
  ren: "mv",
  tracert: "traceroute",
  tasklist: "ps",
  taskkill: "kill",
  findstr: "grep",
};

/**
 * Herramientas obsoletas que ya no vienen instaladas en Debian/Ubuntu actuales (paquete net-tools).
 * Responden como en un sistema moderno ("command not found") y la glosa enseña la herramienta vigente.
 */
export const OBSOLETOS: Record<string, string> = {
  ifconfig: "ip a",
  netstat: "ss",
  route: "ip route",
  arp: "ip neigh",
  iwconfig: "iw",
};
