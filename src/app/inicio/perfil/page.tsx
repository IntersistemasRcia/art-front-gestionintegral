// src/app/inicio/profile/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useAuth } from '@/data/AuthContext';
import { useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  Box,
  Paper,
  Divider,
  Avatar
} from '@mui/material';

import Grid from '@mui/material/Grid';

import MailIcon from '@mui/icons-material/Mail';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import BadgeIcon from '@mui/icons-material/Badge';
import CodeIcon from '@mui/icons-material/Code';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CustomButton from '@/utils/ui/button/CustomButton';

import styles from './perfil.module.css';
import Formato from "@/utils/Formato";

function ProfilePage() {
  const { data: session, status } = useSession();
  const { hasTask } = useAuth();
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  const detalleEnabled = hasTask("perfil_DetalleSesion");

  if (status === "loading") {
    return (
      <Grid container justifyContent="center" alignItems="center" className={styles.fullHeight}>
        <Typography variant="h5">Cargando...</Typography>
      </Grid>
    );
  }

  if (!session || !session.user) {
    return (
      <Grid container justifyContent="center" alignItems="center" className={styles.fullHeight}>
        <Typography variant="h5">No has iniciado sesión.</Typography>
      </Grid>
    );
  }

  const { rol, nombre, cuit, empresaCUIT, empresaRazonSocial } = session.user as any;

  return (
    <Box className={styles.pagePadding}>
      <Typography variant="h4" component="h1" gutterBottom className={styles.title}>
        Perfil de Usuario
      </Typography>

      <Paper elevation={3} className={styles.profileContainer}>
        <Box className={styles.header}>
          <Avatar 
            alt={nombre || session.user?.name} 
            src={session.user?.image || undefined} 
            className={styles.avatar}
          />
          <Typography variant="h5" className={styles.headerText}>
            {nombre || session.user?.name}
          </Typography>
        </Box>

        <Grid container spacing={4} className={styles.gridPadding}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card raised className={styles.card}>
              <CardContent>
                <Typography variant="h6" gutterBottom className={styles.sectionTitle}>
                  <AccountCircleIcon className={styles.iconSectionTitle} />
                  Información Personal
                </Typography>
                <Divider className={styles.dividerMargin} />
                
                <Box className={styles.dataItem}>
                  <PersonIcon className={styles.icon} />
                  <Typography variant="body1" component="span">
                    <span className={styles.label}>Nombre: {nombre ?? "N/A"}</span>  
                  </Typography>
                </Box>
                
                <Box className={styles.dataItem}>
                  <MailIcon className={styles.icon} />
                  <Typography variant="body1" component="span">
                    <span className={styles.label}>Email: {session.user?.email}</span>  
                  </Typography>
                </Box>
                
                <Box className={styles.dataItem}>
                  <BadgeIcon className={styles.icon} />
                  <Typography variant="body1" component="span">
                    <span className={styles.label}>CUIT/CUIL: {Formato.CUIP(cuit) ?? "N/A"}</span> 
                  </Typography>
                </Box>
                
                <Box className={styles.dataItem}>
                  <CodeIcon className={styles.icon} />
                  <Typography variant="body1" component="span">
                    <span className={styles.label}>Rol: {rol ?? "N/A"}</span> 
                  </Typography>
                </Box>

                {(empresaCUIT || empresaRazonSocial) && (
                  <>
                    <Divider className={styles.dividerMargin} sx={{ marginTop: 3 }} />
                    
                    <Typography variant="h6" gutterBottom className={styles.sectionTitle} sx={{ marginTop: 2 }}>
                      <BusinessIcon className={styles.iconSectionTitle} />
                      Empresa Relacionada
                    </Typography>
                    
                    <Box className={styles.dataItem}>
                      <BusinessIcon className={styles.icon} />
                      <Typography variant="body1" component="span">
                        <span className={styles.label}>Razón Social: {empresaRazonSocial ?? "N/A"}</span>  
                      </Typography>
                    </Box>
                    
                    <Box className={styles.dataItem}>
                      <BadgeIcon className={styles.icon} />
                      <Typography variant="body1" component="span">
                        <span className={styles.label}>CUIT Empresa: {Formato.CUIP(empresaCUIT) ?? "N/A"}</span> 
                      </Typography>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card raised className={styles.card}>
              <CardContent>
                <Typography variant="h6" gutterBottom className={styles.sectionTitle}>
                  <InfoIcon className={styles.iconSectionTitle} />
                  Detalles de la Sesión
                </Typography>
                <Divider className={styles.dividerMargin} />
                
                <Box className={styles.dataItem} style={{ justifyContent: 'center' }}>
                  <CustomButton 
                    onClick={() => setMostrarDetalles(!mostrarDetalles)}
                    size="mid"
                    disabled={!detalleEnabled}
                  >
                    {mostrarDetalles ? (
                      <>
                        <VisibilityOffIcon sx={{ marginRight: 1 }} />
                        Ocultar detalles de sesión
                      </>
                    ) : (
                      <>
                        <VisibilityIcon sx={{ marginRight: 1 }} />
                        Ver detalles de sesión
                      </>
                    )}
                  </CustomButton>
                </Box>
                
                {mostrarDetalles && (
                  <Box sx={{ marginTop: 2 }}>
                    <pre className={styles.pre}>
                      {JSON.stringify(session, null, 2)}
                    </pre>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

      </Paper>
    </Box>
  );
}

export default ProfilePage;