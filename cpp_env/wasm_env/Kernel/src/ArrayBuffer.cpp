#include "ArrayBuffer.h"



template<>
ArrayBuffer<double>::ArrayBuffer(int length, double* data) 
{
	const int l = length;
    this->data = (void *) &(*data);
	this->length = length;
}

template<>
ArrayBuffer<double>::ArrayBuffer()
{
    this->length = 0;
    this->data = nullptr;
}

template <>
void ArrayBuffer<double>::fill(int length, double* data)
{
    const int l = length;
    this->data = (void *) &(*data);
	this->length = length;
}

template <class T>
void ArrayBuffer<T>::fill(int length, T* data) 
{
}

template<class T>
ArrayBuffer<T>::ArrayBuffer()
{
}

template <class T>
ArrayBuffer<T>::ArrayBuffer(int length, T* data) {
	this->data = data;
	this->length = length;

}