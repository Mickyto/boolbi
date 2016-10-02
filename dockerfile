FROM node:6.7.0




RUN curl -sfLO http://www.imagemagick.org/download/ImageMagick-7.0.3-1.tar.gz
RUN tar -xzf ImageMagick-7.0.3-1.tar.gz
WORKDIR ./ImageMagick-7.0.3-1
RUN ./configure && make
RUN make install
RUN cd .. && rm -rf  ImageMagick*

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
EXPOSE 3000

