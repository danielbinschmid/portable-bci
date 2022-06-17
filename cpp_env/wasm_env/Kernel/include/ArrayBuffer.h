
template <class T>
struct ArrayBuffer {

	ArrayBuffer();
	ArrayBuffer(const int length, T* data);
	int length;

    void fill(const int length, T* data);
	

	void* data;


	

};