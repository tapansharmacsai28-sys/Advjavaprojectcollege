package com.tradevault.model;
import jakarta.persistence.*; import java.time.LocalDate;
@Entity public class TradingFolder {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id; @ManyToOne(optional=false) private AppUser owner; @Column(nullable=false) private String name; @Column(nullable=false) private String type; private String parentPath; private boolean archived; private LocalDate createdDate=LocalDate.now();
 protected TradingFolder(){} public TradingFolder(AppUser o,String n,String t,String p){owner=o;name=n;type=t;parentPath=p == null || p.isBlank() ? "/" : p;}
 public Long getId(){return id;} public String getName(){return name;} public String getType(){return type;} public String getParentPath(){return parentPath;} public boolean isArchived(){return archived;} public AppUser getOwner(){return owner;}
}
