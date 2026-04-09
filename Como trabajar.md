# como se van a manejar las versiones

se utilizaran las releases de github para llevar el versionado, los cambios estarán en el archivo correspondiente en anitype para el proyecto.

habrá una rama para el desarrollo, una para los bugs y otra para la versión final.

- dev: La rama dev sera la rama donde deben ir los cambios antes de la rama principal, puedes hacer cuantas ramas te parezcan para trabajar, pero siempre al terminar la integración, debe enviar los cambios a la rama dev, esto para validar que la integración funcione bien y no haya conflicto en el código de diferentes personas.

- main: La rama main recibirá todos los cambios de la rama dev aprobados, pero hay algo que se debe tener en cuenta.
  - la rama main recibirá los cambios cuanto se haya terminado una versión completa, los cambios seguirán en dev hasta entonces.
  - si no se ha terminado una versión completa, se subirán los cambios los días viernes y los cambios restantes pasaran a ser de la siguiente versión.

- Bugs: La rama bugs recibirá todos los cambios relacionados a solución de errores esta rama tendrá prioridad se harán pull request, todos los días al final del día si hay commits con bugs solucionados.

## Como trabajar con este formato de ramas

1 . Crear tu rama

```git
# Cambiar a la rama dev
git checkout dev

# Traer los cambios
git pull origin dev

# Crear una rama feature donde trabajar
git checkout -b feature/mi-cambio
```

2 . Trabajar normalmente

```git
git add .
git commit -m "Agregué nueva funcionalidad"
```

3 . Subir los cambios

```git
git push origin feature/mi-cambio
```

4 . Hacer la pr
Luego en el momento de hacer la pr se debe verificar que la rama a la que apunta es la rama dev.

- Mal:
  <img width="1236" height="61" alt="2026-04-09-014755_hyprshot" src="https://github.com/user-attachments/assets/7939781b-5448-4073-bbeb-6ab02461838b" />
- Bien
  <img width="1245" height="62" alt="2026-04-09-014914_hyprshot" src="https://github.com/user-attachments/assets/84e15990-beda-4ef3-aaec-b5aea4382ac3" />

### Recomendaciones

# 1. Actualizas dev desde remoto

git checkout dev
git pull origin dev

# 2. Actualizas tu rama bugs

git checkout bugs
git merge dev

# 3. Trabajas y haces commit

git add .
git commit -m "fix: error en login"

# 4. Subes tu rama

git push origin "el nombre de tu rama"

# 5. PR: "tu rama" → bugs

> [!TIP]
> usar las carapteristicas de las pull request
> <img width="327" height="241" alt="2026-04-09-014926_hyprshot" src="https://github.com/user-attachments/assets/47da0efc-8c21-4c19-b289-5869a5b0d711" />
> <img width="348" height="452" alt="2026-04-09-015008_hyprshot" src="https://github.com/user-attachments/assets/b201cd78-95a2-40fd-b6fb-aaf8cfb98ba2" />
>
> > > > > > > Stashed changes
> > > > > > > 5d66e27 (como trabajar)

> [!IMPORTANT]
> Hacer un commit o push cada que tengan algo terminado, para que el resto de de desarrolladores pueda tener el cambio.

> [!NOTE]
> Tener registro en vídeo o en imagen de los cambios para registrarlo en las versiones.
