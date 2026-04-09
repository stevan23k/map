# como se va a manejar las versiones
se utilizaran las releases de github para llevar el versionado, los cambios estarán en el archivo correspondiente en anitype para el proyecto.

habrá una rama para el desarrollo, una para los bugs y otra para la versión final.

- dev: La rama dev sera la rama donde deben ir los cambios antes de la rama principal, puedes hacer cuantas ramas te parezcan para trabajar, pero siempre al terminar la integración, debe enviar los cambios a la rama dev, esto para validar que la integración funcione bien y no haya conflicto en el código de diferentes personas.

- main: La rama main recibirá todos los cambios de la rama dev aprobados, pero hay algo que se debe tener en cuenta.
	- la rama main recibirá los cambios cuanto se haya terminado una versión completa, los cambios seguirán en dev hasta entonces.
	- si no se ha terminado una versión completa, se subirán los cambios los días viernes y los cambios restantes pasaran a ser de la siguiente versión.

- Bugs: La rama bugs recibirá todos los cambios relacionados a solución de errores esta rama tendrá prioridad se harán pull request, todos los días al final del día si hay commits con bugs solucionados.  


4 . Hacer la pr
Luego en el momento de hacer la pr se debe verificar que la rama a la que apunta es la rama dev.

> [!IMPORTANT]
> Hacer un commit o push cada que tengan algo terminado, para que el resto de de desarrolladores pueda tener el cambio.

> [!NOTE]
> Tener registro en vídeo o en imagen de los cambios para registrarlo en las versiones. 
