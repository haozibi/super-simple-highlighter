package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	err := Run(9090)
	if err != nil {
		panic(err)
	}
}

func Run(port int) error {
	http.HandleFunc("/upload", upload)

	fmt.Println("listen: ", port)
	return http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
}

func upload(w http.ResponseWriter, r *http.Request) {

	body, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Println(err)
		return
	}

	fmt.Println("req body:", string(body))

	fileBody, err := os.ReadFile("/Users/bi/Desktop/1.ldjson")
	if err != nil {
		fmt.Println(err)
		return
	}

	w.Write(fileBody)

	//w.Write([]byte("i receive ok_" + string(body)))
}
